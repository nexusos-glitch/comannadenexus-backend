async function check() {
  const r = await fetch('http://localhost:3000/api/api-keys');
  console.log(r.status, r.headers.get('content-type'));
  const text = await r.text();
  console.log(text.substring(0, 100));
}
check();
