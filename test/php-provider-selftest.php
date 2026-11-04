<?php
declare(strict_types=1);

// Runs the complete simulated provider flow on a PHP 8.2 host, without Node.js.
$base = $argv[1] ?? 'https://balanov.pro/latch/api';
$checks = [];
function check(bool $condition, string $name): void {
    global $checks;
    if (!$condition) throw new RuntimeException("FAIL: {$name}");
    $checks[] = $name;
    echo "PASS {$name}\n";
}
function callApi(string $base, array $payload, ?string $key = null, ?int $expectedStatus = null): array {
    $headers = ['Content-Type: application/json', 'Accept: application/latch+json, application/json'];
    if ($key !== null) $headers[] = 'Idempotency-Key: ' . $key;
    $curl = curl_init($base . '/');
    curl_setopt_array($curl, [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
    ]);
    $raw = curl_exec($curl);
    if ($raw === false) throw new RuntimeException(curl_error($curl));
    $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
    $data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
    if ($expectedStatus !== null && $status !== $expectedStatus) throw new RuntimeException("Expected HTTP {$expectedStatus}, got {$status}: {$raw}");
    return $data;
}
function envelope(string $id, string $op, array $fields = []): array {
    return ['latch' => '0.1', 'id' => $id, 'op' => $op] + $fields;
}

try {
    $card = json_decode(file_get_contents($base . '/latch.json'), true, 512, JSON_THROW_ON_ERROR);
    check($card['latch'] === '0.1' && str_ends_with($card['endpoint'], '/latch/api/'), 'HTTPS discovery and independent card');
    $read = callApi($base, envelope('selftest-read', 'ask', ['capability' => 'materials.list', 'input' => (object)[]]));
    check(count($read['result']['materials']) === 3, 'read materials');
    $input = ['model_url' => 'https://example.com/models/duck.stl', 'material' => 'pla', 'quantity' => 2, 'delivery' => ['country' => 'NL', 'postal_code' => '1011']];
    $quote = callApi($base, envelope('selftest-quote', 'quote', ['capability' => 'print3d.order', 'input' => $input]));
    check($quote['offer']['terms']['amount'] === 3100 && $quote['offer']['terms']['simulation'] === true, 'exact simulated quote');
    check(str_starts_with($quote['offer']['digest'], 'sha256-'), 'offer digest present');
    $approval = ['decision' => 'approve', 'offer_digest' => $quote['offer']['digest'], 'method' => 'php-selftest-explicit', 'at' => gmdate('c')];
    $key = 'selftest-' . bin2hex(random_bytes(16));
    $commitRequest = envelope('selftest-commit', 'commit', ['offer' => $quote['offer']['id'], 'offer_digest' => $quote['offer']['digest'], 'approval' => $approval]);
    $commit = callApi($base, $commitRequest, $key);
    check($commit['state'] === 'succeeded' && $commit['task']['result']['status'] === 'recorded_simulation', 'explicit simulated commit');
    $commitRequest['id'] = 'selftest-replay';
    $replay = callApi($base, $commitRequest, $key);
    check($replay['task']['id'] === $commit['task']['id'] && $replay['receipt'] === $commit['receipt'] && $replay['id'] !== $commit['id'], 'same-key replay retains one task and current correlation id');
    $status = callApi($base, envelope('selftest-status', 'status', ['task' => $commit['task']['id']]));
    check($status['receipt']['evidence'] === 'provider_assertion', 'provider assertion receipt boundary');
    callApi($base, envelope('selftest-cancel', 'cancel', ['task' => $commit['task']['id']]), null, 409);
    check(true, 'terminal cancellation rejected without rollback claim');
    callApi($base, envelope('selftest-missing', 'status', ['task' => 'task_missing']), null, 404);
    check(true, 'unknown task rejected');
    $wrong = $approval;
    $wrong['offer_digest'] = 'sha256-' . str_repeat('0', 64);
    callApi($base, envelope('selftest-wrong-approval', 'commit', ['offer' => $quote['offer']['id'], 'offer_digest' => $quote['offer']['digest'], 'approval' => $wrong]), 'selftest-wrong-' . bin2hex(random_bytes(16)), 409);
    check(true, 'mismatched approval rejected before execution');
    echo json_encode(['passed' => true, 'checks' => $checks, 'task_id' => $commit['task']['id'], 'offer_digest' => $quote['offer']['digest']], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
} catch (Throwable $error) {
    fwrite(STDERR, json_encode(['passed' => false, 'error' => $error->getMessage(), 'checks' => $checks], JSON_PRETTY_PRINT) . "\n");
    exit(1);
}
