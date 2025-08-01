import { useState } from 'react';
import { testDatabaseConnection, testAllTables, createTestData } from '../utils/databaseTest';
import { debugDatabaseConnection, printDiagnostics } from '../utils/debugDatabase';

export default function DatabaseTestPage() {
  const [connectionResult, setConnectionResult] = useState<any>(null);
  const [tableResults, setTableResults] = useState<any>(null);
  const [testDataResult, setTestDataResult] = useState<any>(null);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleTestConnection = async () => {
    setLoading(true);
    try {
      const result = await testDatabaseConnection();
      setConnectionResult(result);
      console.log('Connection test result:', result);
    } catch (error) {
      console.error('Test failed:', error);
      setConnectionResult({ success: false, error: 'Test failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleTestTables = async () => {
    setLoading(true);
    try {
      const results = await testAllTables();
      setTableResults(results);
      console.log('Table test results:', results);
    } catch (error) {
      console.error('Table test failed:', error);
      setTableResults({ error: 'Table test failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTestData = async () => {
    setLoading(true);
    try {
      const result = await createTestData();
      setTestDataResult(result);
      console.log('Test data result:', result);
    } catch (error) {
      console.error('Test data creation failed:', error);
      setTestDataResult({ success: false, error: 'Test data creation failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleFullDiagnostics = async () => {
    setLoading(true);
    try {
      const results = await debugDatabaseConnection();
      setDiagnostics(results);
      printDiagnostics(results);
      console.log('Full diagnostics:', results);
    } catch (error) {
      console.error('Diagnostics failed:', error);
      setDiagnostics({ error: 'Diagnostics failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Database Connection Test</h1>
        
        <div className="space-y-6">
          {/* Full Diagnostics */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">🔍 Full Database Diagnostics</h2>
            <p className="text-gray-600 mb-4">
              Comprehensive step-by-step analysis of database connection issues.
            </p>
            <button
              onClick={handleFullDiagnostics}
              disabled={loading}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Run Full Diagnostics'}
            </button>
            
            {diagnostics && (
              <div className="mt-4 p-4 bg-gray-100 rounded">
                <h3 className="font-semibold mb-2">Diagnostic Results:</h3>
                <div className="space-y-3 text-sm">
                  {/* Step 1: Configuration */}
                  <div className={`p-3 rounded ${diagnostics.step1_config?.hasUrl && diagnostics.step1_config?.hasKey ? 'bg-green-100' : 'bg-red-100'}`}>
                    <strong>1️⃣ Configuration:</strong>
                    <div className="ml-4 mt-1">
                      <div>URL: {diagnostics.step1_config?.hasUrl ? '✅' : '❌'} {diagnostics.step1_config?.url}</div>
                      <div>Key: {diagnostics.step1_config?.hasKey ? '✅' : '❌'} {diagnostics.step1_config?.keyPreview}</div>
                    </div>
                  </div>

                  {/* Step 2: Client */}
                  {diagnostics.step2_client && (
                    <div className={`p-3 rounded ${diagnostics.step2_client.success ? 'bg-green-100' : 'bg-red-100'}`}>
                      <strong>2️⃣ Client Creation:</strong> {diagnostics.step2_client.success ? '✅' : '❌'}
                      {diagnostics.step2_client.error && (
                        <div className="ml-4 mt-1 text-red-600">Error: {diagnostics.step2_client.error}</div>
                      )}
                    </div>
                  )}

                  {/* Step 3: Connection */}
                  {diagnostics.step3_connection && (
                    <div className={`p-3 rounded ${diagnostics.step3_connection.success ? 'bg-green-100' : 'bg-red-100'}`}>
                      <strong>3️⃣ Connection Test:</strong> {diagnostics.step3_connection.success ? '✅' : '❌'}
                      {diagnostics.step3_connection.error && (
                        <div className="ml-4 mt-1 text-red-600">Error: {diagnostics.step3_connection.error}</div>
                      )}
                    </div>
                  )}

                  {/* Step 4: Tables */}
                  {diagnostics.step4_tables && (
                    <div className="p-3 rounded bg-gray-50">
                      <strong>4️⃣ Tables Status:</strong>
                      <div className="ml-4 mt-1 grid grid-cols-1 gap-1">
                        {Object.entries(diagnostics.step4_tables).map(([table, status]: [string, any]) => (
                          <div key={table} className={`p-2 rounded text-xs ${status.exists ? 'bg-green-100' : 'bg-red-100'}`}>
                            <span className="font-mono">{table}:</span>
                            {status.exists ? (
                              <span className="ml-2">✅ {status.count} records</span>
                            ) : (
                              <span className="ml-2">❌ {status.error}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 5: Data Access */}
                  {diagnostics.step5_data && (
                    <div className={`p-3 rounded ${diagnostics.step5_data.success ? 'bg-green-100' : 'bg-red-100'}`}>
                      <strong>5️⃣ Data Access:</strong> {diagnostics.step5_data.success ? '✅' : '❌'}
                      {diagnostics.step5_data.error && (
                        <div className="ml-4 mt-1 text-red-600">Error: {diagnostics.step5_data.error}</div>
                      )}
                      {diagnostics.step5_data.success && (
                        <div className="ml-4 mt-1 text-green-600">Found {diagnostics.step5_data.count} sample records</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Connection Test */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Test Database Connection</h2>
            <button
              onClick={handleTestConnection}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Connection'}
            </button>
            
            {connectionResult && (
              <div className={`mt-4 p-4 rounded ${connectionResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <h3 className="font-semibold">Connection Result:</h3>
                <pre className="mt-2 text-sm overflow-auto">
                  {JSON.stringify(connectionResult, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Table Test */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Test All Tables</h2>
            <button
              onClick={handleTestTables}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Tables'}
            </button>
            
            {tableResults && (
              <div className="mt-4 p-4 bg-gray-100 rounded">
                <h3 className="font-semibold">Table Results:</h3>
                <div className="mt-2 space-y-2">
                  {Object.entries(tableResults).map(([table, result]: [string, any]) => (
                    <div key={table} className={`p-2 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      <span className="font-mono">{table}:</span>
                      {result.success ? (
                        <span className="ml-2">✅ {result.count} records</span>
                      ) : (
                        <span className="ml-2">❌ {result.error}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Create Test Data */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Create Test Data</h2>
            <p className="text-gray-600 mb-4">
              Only run this if tables exist but are empty.
            </p>
            <button
              onClick={handleCreateTestData}
              disabled={loading}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Test Data'}
            </button>
            
            {testDataResult && (
              <div className={`mt-4 p-4 rounded ${testDataResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <h3 className="font-semibold">Test Data Result:</h3>
                <pre className="mt-2 text-sm overflow-auto">
                  {JSON.stringify(testDataResult, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">🛠️ Troubleshooting Guide</h2>
            
            <div className="mb-6">
              <h3 className="font-semibold mb-2">🔍 Step 1: Run Full Diagnostics</h3>
              <p className="text-sm text-gray-700 mb-2">
                Click "Run Full Diagnostics" above to see exactly what's wrong with your database connection.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-2">🗄️ Step 2: Set Up Database Tables</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                <li>Go to your Supabase dashboard: <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://supabase.com/dashboard</a></li>
                <li>Select your project: <code className="bg-gray-200 px-1 rounded">setkamakzbnhtosacdee</code></li>
                <li>Go to "SQL Editor" in the left sidebar</li>
                <li>Copy the entire <code className="bg-gray-200 px-1 rounded">database-schema.sql</code> file contents</li>
                <li>Paste and run the SQL to create all tables and sample data</li>
              </ol>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-2">✅ Step 3: Verify Connection</h3>
              <p className="text-sm text-gray-700">
                After running the SQL, come back here and run the diagnostics again to confirm everything is working.
              </p>
            </div>
            
            <div className="p-4 bg-yellow-100 rounded border-l-4 border-yellow-400">
              <h4 className="font-semibold text-yellow-800">🔧 Current Database Info</h4>
              <div className="text-yellow-700 text-sm mt-1">
                <div>Project: <code>setkamakzbnhtosacdee</code></div>
                <div>URL: <code>https://setkamakzbnhtosacdee.supabase.co</code></div>
                <div>Schema file: <code>database-schema.sql</code> (in project root)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
