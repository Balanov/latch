<?php
declare(strict_types=1);

// Independent LATCH 0.1 demo. No payment, model download, production, or delivery.
// The JSON store is outside the public document root and protected by flock().
const PROTOCOL = '0.1';
const BODY_LIMIT = 262144;
const JSON_FLAGS = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_LINE_TERMINATORS;

final class LatchFailure extends RuntimeException {
    public function __construct(public string $latchCode, string $message, public int $httpStatus = 400, public bool $retryable = false) {
        parent::__construct($message);
    }
}
function fail(string $code, string $message, int $status = 400): never {
    throw new LatchFailure($code, $message, $status);
}
function id(string $prefix): string { return $prefix . '_' . bin2hex(random_bytes(16)); }
function isoTime(int $offset = 0): string { return gmdate('Y-m-d\TH:i:s', time() + $offset) . '.000Z'; }
function canonical(mixed $value): string {
    if ($value === null || is_bool($value) || is_int($value) || is_float($value) || is_string($value)) {
        $json = json_encode($value, JSON_FLAGS);
        if ($json === false) fail('invalid_json', 'A value cannot be represented as JSON.', 500);
        return $json;
    }
    if (is_array($value)) {
        if (array_is_list($value)) return '[' . implode(',', array_map('canonical', $value)) . ']';
        $value = (object)$value;
    }
    if ($value instanceof stdClass) {
        $members = get_object_vars($value);
        $keys = array_keys($members);
        sort($keys, SORT_STRING);
        $parts = [];
        foreach ($keys as $key) $parts[] = json_encode($key, JSON_FLAGS) . ':' . canonical($members[$key]);
        return '{' . implode(',', $parts) . '}';
    }
    fail('invalid_json', 'A value is not JSON-compatible.', 500);
}
function digest(mixed $value): string { return 'sha256-' . hash('sha256', canonical($value)); }
function uuidRequest(object $request): void {
    if (($request->latch ?? null) !== PROTOCOL) fail('version_unsupported', 'Only LATCH 0.1 is supported.', 422);
    if (!isset($request->id) || !is_string($request->id) || strlen($request->id) > 200 || $request->id === '') fail('invalid_request', 'A bounded request id is required.');
    if (!in_array($request->op ?? null, ['ask', 'quote', 'commit', 'status', 'cancel'], true)) fail('unknown_operation', 'Unknown operation.');
}
function card(): array { return json_decode(file_get_contents(__DIR__ . '/latch.json'), true, 512, JSON_THROW_ON_ERROR); }
function respond(object $request, string $state, array $extra = []): array {
    return ['latch' => PROTOCOL, 'id' => $request->id, 'ok' => true, 'state' => $state] + $extra;
}
function publicOffer(array $offer): array {
    return ['id' => $offer['id'], 'capability' => $offer['capability'], 'summary' => $offer['summary'], 'terms' => $offer['terms'], 'expires_at' => $offer['expires_at'], 'digest' => $offer['digest']];
}
function publicTask(array $task): array {
    return array_filter($task, fn($key) => !str_starts_with($key, '_'), ARRAY_FILTER_USE_KEY);
}
function storePath(): string {
    $configured = getenv('LATCH_DEMO_STORE');
    if (is_string($configured) && $configured !== '') return $configured;
    return rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'latch-demo-' . hash('sha256', __DIR__) . '.json';
}
function prune(object $state): void {
    $now = time();
    foreach (['offers', 'idempotency'] as $kind) {
        $entries = get_object_vars($state->{$kind});
        $state->{$kind} = (object)array_filter($entries, fn($entry) => ($entry['expires_at_epoch'] ?? $entry['stored_at_epoch'] ?? 0) > $now);
    }
    $tasks = get_object_vars($state->tasks);
    uasort($tasks, fn($a, $b) => strcmp($b['created_at'], $a['created_at']));
    $state->tasks = (object)array_slice($tasks, 0, 50, true);
}
function withStore(callable $callback): array {
    $path = storePath();
    $directory = dirname($path);
    if (!is_dir($directory)) mkdir($directory, 0700, true);
    $handle = fopen($path, 'c+');
    if ($handle === false) fail('store_unavailable', 'The demo store cannot be opened.', 503);
    $locked = false;
    for ($attempt = 0; $attempt < 20; $attempt++) {
        if (flock($handle, LOCK_EX | LOCK_NB)) { $locked = true; break; }
        usleep(100000);
    }
    if (!$locked) { fclose($handle); fail('store_busy', 'The demo store is busy; retry later.', 503); }
    try {
        $raw = stream_get_contents($handle);
        $state = $raw === '' ? (object)['offers' => (object)[], 'tasks' => (object)[], 'idempotency' => (object)[]] : (object)json_decode($raw, true);
        if (!$state instanceof stdClass || !isset($state->offers, $state->tasks, $state->idempotency)) fail('store_corrupt', 'The demo store is invalid; it was not changed.', 500);
        prune($state);
        [$result, $changed] = $callback($state);
        if ($changed) {
            $json = json_encode($state, JSON_FLAGS);
            if ($json === false) fail('store_unavailable', 'The demo store cannot be serialized.', 503);
            rewind($handle);
            if (!ftruncate($handle, 0) || fwrite($handle, $json) === false || !fflush($handle)) fail('store_unavailable', 'The demo store cannot be saved.', 503);
        }
        return $result;
    } finally {
        flock($handle, LOCK_UN);
        fclose($handle);
    }
}
function validateOrder(mixed $input): void {
    if (!$input instanceof stdClass) fail('invalid_input', 'Order input must be an object.', 422);
    if (array_diff(array_keys(get_object_vars($input)), ['model_url', 'material', 'quantity', 'delivery'])) fail('invalid_input', 'Unknown order field.', 422);
    foreach (['model_url', 'material', 'quantity', 'delivery'] as $field) if (!property_exists($input, $field)) fail('invalid_input', "Missing {$field}.", 422);
    if (!is_string($input->model_url) || strlen($input->model_url) < 8 || strlen($input->model_url) > 2048 || !filter_var($input->model_url, FILTER_VALIDATE_URL)) fail('invalid_input', 'model_url must be a valid bounded URL.', 422);
    if (!in_array($input->material, ['pla', 'petg', 'resin'], true)) fail('invalid_input', 'Unknown material.', 422);
    if (!is_int($input->quantity) || $input->quantity < 1 || $input->quantity > 100) fail('invalid_input', 'quantity must be an integer from 1 to 100.', 422);
    if (!$input->delivery instanceof stdClass || array_diff(array_keys(get_object_vars($input->delivery)), ['country', 'postal_code'])) fail('invalid_input', 'Invalid delivery.', 422);
    if (!is_string($input->delivery->country ?? null) || !preg_match('/^[A-Za-z]{2}$/', $input->delivery->country)) fail('invalid_input', 'country must contain two letters.', 422);
    if (!is_string($input->delivery->postal_code ?? null) || strlen($input->delivery->postal_code) < 2 || strlen($input->delivery->postal_code) > 20) fail('invalid_input', 'Invalid postal_code.', 422);
}
function commitFingerprint(object $request): string {
    $approval = $request->approval instanceof stdClass ? clone $request->approval : (object)[];
    unset($approval->proof);
    return digest(['op' => 'commit', 'offer' => $request->offer, 'offer_digest' => $request->offer_digest, 'approval' => $approval]);
}

header('Content-Type: application/latch+json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Idempotency-Key');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('X-Content-Type-Options: nosniff');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    header('Cache-Control: public, max-age=60');
    echo json_encode(card(), JSON_FLAGS);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit; }
$requestId = null;
try {
    $type = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
    if (!str_contains(strtolower($type), 'application/json') && !str_contains(strtolower($type), '+json')) fail('unsupported_media_type', 'Content-Type must be application/json.', 415);
    $body = file_get_contents('php://input', false, null, 0, BODY_LIMIT + 1);
    if (strlen($body) > BODY_LIMIT) fail('payload_too_large', 'JSON body exceeds the configured limit.', 413);
    $request = json_decode($body);
    if (!$request instanceof stdClass) fail('malformed_json', 'Request body is not a JSON object.', 400);
    $requestId = $request->id ?? null;
    uuidRequest($request);
    $result = null;
    if ($request->op === 'ask') {
        if (($request->capability ?? null) === 'print3d.order') fail('operation_mode_mismatch', 'ask is not valid for a write capability.', 409);
        if (($request->capability ?? null) !== 'materials.list') fail('capability_not_found', 'The read capability does not exist.', 404);
        if ($request->input instanceof stdClass && get_object_vars($request->input)) fail('invalid_input', 'materials.list takes no input.', 422);
        $materials = [];
        foreach (['pla' => 950, 'petg' => 1200, 'resin' => 1900] as $material => $price) $materials[] = ['id' => $material, 'unit_price' => $price, 'currency' => 'EUR'];
        $result = respond($request, 'succeeded', ['result' => ['materials' => $materials]]);
    } elseif ($request->op === 'quote') {
        if (($request->capability ?? null) === 'materials.list') fail('operation_mode_mismatch', 'quote is not valid for a read capability.', 409);
        if (($request->capability ?? null) !== 'print3d.order') fail('capability_not_found', 'The write capability does not exist.', 404);
        validateOrder($request->input ?? null);
        $input = $request->input;
        $prices = ['pla' => 950, 'petg' => 1200, 'resin' => 1900];
        $amount = $prices[$input->material] * $input->quantity + 1200;
        $result = withStore(function (object $state) use ($request, $input, $amount, $prices): array {
            $offer = [
                'id' => id('off'), 'capability' => 'print3d.order',
                'summary' => $input->quantity . ' × ' . strtoupper($input->material) . ' model, EUR ' . number_format($amount / 100, 2, '.', '') . ', simulated delivery in 3–5 days',
                'terms' => ['amount' => $amount, 'currency' => 'EUR', 'unit_amount' => $prices[$input->material], 'shipping_amount' => 1200, 'delivery_days' => [3, 5], 'simulation' => true],
                'expires_at' => isoTime(300)
            ];
            $offer['digest'] = digest($offer);
            $offer['input'] = $input;
            $offer['data'] = ['normalized_model_url' => $input->model_url];
            $offer['expires_at_epoch'] = time() + 300;
            $state->offers->{$offer['id']} = $offer;
            return [respond($request, 'offered', ['offer' => publicOffer($offer)]), true];
        });
    } elseif ($request->op === 'commit') {
        $key = $_SERVER['HTTP_IDEMPOTENCY_KEY'] ?? '';
        if (!is_string($key) || !preg_match('/^[A-Za-z0-9._~-]{16,200}$/', $key)) fail('idempotency_key_required', 'A bounded Idempotency-Key header is required.');
        $fingerprint = commitFingerprint($request);
        $result = withStore(function (object $state) use ($request, $key, $fingerprint): array {
            $replay = fn(array $response): array => array_replace($response, ['id' => $request->id]);
            $existing = $state->idempotency->{$key} ?? null;
            if ($existing) {
                if ($existing['fingerprint'] !== $fingerprint) fail('idempotency_conflict', 'The idempotency key was used with different content.', 409);
                return [$replay($existing['response']), false];
            }
            $stored = $state->offers->{$request->offer ?? ''} ?? null;
            if (!$stored) fail('offer_not_found', 'The offer does not exist.', 404);
            $unsigned = publicOffer($stored);
            unset($unsigned['digest']);
            if (!hash_equals($stored['digest'], (string)($request->offer_digest ?? '')) || !hash_equals(digest($unsigned), (string)($request->offer_digest ?? ''))) fail('offer_digest_mismatch', 'The committed digest does not match the exact offer.', 409);
            if (($stored['expires_at_epoch'] ?? 0) <= time()) fail('offer_expired', 'The offer has expired.', 410);
            if (($request->approval->decision ?? null) !== 'approve') fail('approval_required', 'Explicit approval is required for this offer.', 403);
            if (!hash_equals($stored['digest'], (string)($request->approval->offer_digest ?? ''))) fail('approval_digest_mismatch', 'Approval is bound to a different offer.', 409);
            $taskId = id('task');
            $task = [
                'id' => $taskId, 'capability' => 'print3d.order', 'state' => 'succeeded', 'created_at' => isoTime(),
                'result' => ['order_id' => id('demo_order'), 'status' => 'recorded_simulation', 'offer_digest' => $stored['digest'], 'model_url' => $stored['input']->model_url, 'note' => 'No object was printed, paid for, or shipped. This is an independent PHP simulation.'],
                '_offerDigest' => $stored['digest'], '_requestDigest' => $fingerprint
            ];
            $receipt = ['id' => id('rcpt'), 'task_id' => $taskId, 'offer_digest' => $stored['digest'], 'request_digest' => $fingerprint, 'issued_at' => isoTime(), 'evidence' => 'provider_assertion'];
            $task['_receipt'] = $receipt;
            $state->tasks->{$taskId} = $task;
            $response = respond($request, 'succeeded', ['task' => publicTask($task), 'receipt' => $receipt]);
            $state->idempotency->{$key} = ['fingerprint' => $fingerprint, 'response' => $response, 'stored_at_epoch' => time() + 3600];
            return [$response, true];
        });
    } else {
        $result = withStore(function (object $state) use ($request): array {
            $task = $state->tasks->{$request->task ?? ''} ?? null;
            if (!$task) fail('task_not_found', 'The task does not exist.', 404);
            if ($request->op === 'status') return [respond($request, $task['state'], ['task' => publicTask($task), ...($task['_receipt'] ? ['receipt' => $task['_receipt']] : [])]), false];
            if (in_array($task['state'], ['succeeded', 'failed', 'cancelled'], true)) fail('task_not_cancellable', 'A terminal task cannot be cancelled.', 409);
            $task['state'] = 'cancelled';
            $state->tasks->{$task['id']} = $task;
            return [respond($request, 'cancelled', ['task' => publicTask($task)]), true];
        });
    }
    http_response_code(200);
    echo json_encode($result, JSON_FLAGS);
} catch (LatchFailure $error) {
    http_response_code($error->httpStatus);
    echo json_encode(['latch' => PROTOCOL, 'id' => is_string($requestId) ? $requestId : null, 'ok' => false, 'error' => ['code' => $error->latchCode, 'message' => $error->getMessage(), 'retryable' => $error->retryable]], JSON_FLAGS);
} catch (Throwable $error) {
    @file_put_contents(storePath() . '.errors.log', gmdate('c') . ' ' . $error::class . ': ' . $error->getMessage() . ' at ' . $error->getFile() . ':' . $error->getLine() . "\n", FILE_APPEND | LOCK_EX);
    http_response_code(500);
    echo json_encode(['latch' => PROTOCOL, 'id' => is_string($requestId) ? $requestId : null, 'ok' => false, 'error' => ['code' => 'internal_error', 'message' => 'The provider failed to process the request.', 'retryable' => true]], JSON_FLAGS);
}
