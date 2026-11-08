// The guarded import every app uses. The norm directory is absent on purpose:
// this fixture proves the app still renders its own content and stays silent
// about the missing package (NORM-OPT-01).

try {
  const { mountNorm } = await import('./norm/norm.js');
  await mountNorm({ app: { name: 'eject', version: '0.0.0' }, normVersion: '2.0.0', docs: [] });
} catch {
  // Without the package: footer and reader are absent, the app keeps working.
}

document.querySelector('#status').textContent = 'ok';
