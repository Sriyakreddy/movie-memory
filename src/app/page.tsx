export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Movie Memory</h1>
      <p>Click below to sign in.</p>

      <a href="/api/auth/signin">Sign in with Google</a>
    </main>
  );
}