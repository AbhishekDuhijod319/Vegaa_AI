// Temporary debug component - DELETE AFTER TESTING
export default function DebugEnv() {
    return (
        <div style={{ padding: '20px', fontFamily: 'monospace' }}>
            <h2>Environment Variables Debug</h2>
            <p><strong>VITE_GOOGLE_AUTH_CLIENT_ID:</strong> {import.meta.env.VITE_GOOGLE_AUTH_CLIENT_ID ? '✅ Set' : '❌ Missing'}</p>
            <p><strong>VITE_GOOGLE_GEMINI_AI_API_KEY:</strong> {import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY ? '✅ Set' : '❌ Missing'}</p>
            <p><strong>VITE_FIREBASE_API_KEY:</strong> {import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing'}</p>
            <p><strong>VITE_PEXELS_API_KEY:</strong> {import.meta.env.VITE_PEXELS_API_KEY ? '✅ Set' : '❌ Missing'}</p>
            <p><strong>Mode:</strong> {import.meta.env.MODE}</p>
            <p><strong>Dev:</strong> {import.meta.env.DEV ? 'Yes' : 'No'}</p>
            <p><strong>Prod:</strong> {import.meta.env.PROD ? 'Yes' : 'No'}</p>
        </div>
    );
}
