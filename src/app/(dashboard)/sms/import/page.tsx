'use client';

import { useState, useRef } from 'react';

type ImportType = 'students' | 'teachers' | 'parents';

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export default function ImportPage() {
  const [importType, setImportType] = useState<ImportType>('students');
  const [file, setFile] = useState<File | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fieldMappings: Record<ImportType, { csv: string; required: boolean }[]> = {
    students: [
      { csv: 'firstName', required: true },
      { csv: 'lastName', required: true },
      { csv: 'middleName', required: false },
      { csv: 'gender', required: false },
      { csv: 'dateOfBirth', required: false },
      { csv: 'email', required: false },
      { csv: 'phone', required: false },
      { csv: 'address', required: false },
      { csv: 'stateOfOrigin', required: false },
      { csv: 'lgaOfOrigin', required: false },
      { csv: 'studentId', required: false },
    ],
    teachers: [
      { csv: 'firstName', required: true },
      { csv: 'lastName', required: true },
      { csv: 'email', required: true },
      { csv: 'phone', required: false },
      { csv: 'employeeId', required: false },
      { csv: 'department', required: false },
      { csv: 'specialty', required: false },
      { csv: 'qualification', required: false },
    ],
    parents: [
      { csv: 'firstName', required: true },
      { csv: 'lastName', required: true },
      { csv: 'email', required: false },
      { csv: 'phone', required: true },
      { csv: 'occupation', required: false },
      { csv: 'studentId', required: true },
    ],
  };

  const sampleCSV: Record<ImportType, string> = {
    students: 'firstName,lastName,gender,email,phone,stateOfOrigin\nJohn,Doe,MALE,john@example.com,08012345678,Lagos\nJane,Smith,FEMALE,jane@example.com,08023456789,Ogun',
    teachers: 'firstName,lastName,email,phone,department\nMary,Johnson,mary@school.com,08034567890,Science\nPeter,Williams,peter@school.com,08045678901,Mathematics',
    parents: 'firstName,lastName,phone,occupation,studentId\nJames,Abiodun,08056789012,Business,STU/001\nGrace,Abiodun,08067890123,Teacher,STU/001',
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setResult(null);

    const text = await selectedFile.text();
    const headers = text.split('\n')[0].split(',').map(h => h.trim());
    
    const initialMapping: Record<string, string> = {};
    headers.forEach(header => {
      const normalized = header.toLowerCase().replace(/[^a-z]/g, '');
      const match = fieldMappings[importType].find(f => 
        f.csv.toLowerCase().replace(/[^a-z]/g, '') === normalized ||
        header.toLowerCase().includes(f.csv.toLowerCase())
      );
      if (match) {
        initialMapping[header] = match.csv;
      }
    });
    setMapping(initialMapping);

    const rows = text.split('\n').slice(1, 6);
    const previewData = rows.filter(r => r.trim()).map(row => {
      const values = row.split(',');
      const obj: any = {};
      headers.forEach((header, i) => {
        obj[header] = values[i]?.trim();
      });
      return obj;
    });
    setPreview(previewData);
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', importType);
      formData.append('mapping', JSON.stringify(mapping));

      const res = await fetch('/api/sms/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ success: 0, failed: preview.length, errors: ['Import failed. Please check your data.'] });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([sampleCSV[importType]], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${importType}_template.csv`;
    a.click();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Import</h1>
          <p className="text-gray-500 mt-1">Import students, teachers, and parents from CSV files</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4">Select Import Type</h2>
            <div className="flex gap-4">
              {(['students', 'teachers', 'parents'] as ImportType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => { setImportType(type); setFile(null); setPreview([]); setResult(null); }}
                  className={`px-4 py-2 rounded-lg capitalize ${
                    importType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Upload File</h2>
              <button
                onClick={downloadTemplate}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Download Template
              </button>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              {file ? (
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600">Click to upload CSV file</p>
                  <p className="text-sm text-gray-400 mt-1">or drag and drop</p>
                </div>
              )}
            </div>
          </div>

          {preview.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold mb-4">Map Columns</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(preview[0] || {}).map(header => (
                        <th key={header} className="px-3 py-2 text-left">
                          <select
                            value={mapping[header] || ''}
                            onChange={(e) => setMapping({ ...mapping, [header]: e.target.value })}
                            className="w-full text-xs border rounded px-2 py-1"
                          >
                            <option value="">-- Skip --</option>
                            {fieldMappings[importType].map(field => (
                              <option key={field.csv} value={field.csv}>
                                {field.csv} {field.required && '*'}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1 truncate">{header}</p>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 3).map((row, i) => (
                      <tr key={i} className="border-t">
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="px-3 py-2 truncate max-w-[150px]">{val as string}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500 mt-2">Showing 3 of {preview.length + 1} rows</p>
            </div>
          )}

          {result && (
            <div className={`rounded-xl border p-6 ${result.failed > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
              <h3 className="font-semibold mb-2">Import Complete</h3>
              <p className="text-green-700">Successfully imported: {result.success}</p>
              {result.failed > 0 && <p className="text-yellow-700">Failed: {result.failed}</p>}
              {result.errors.length > 0 && (
                <div className="mt-3 text-sm text-gray-600">
                  <p className="font-medium">Errors:</p>
                  <ul className="list-disc list-inside">
                    {result.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold mb-4">Instructions</h3>
            <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
              <li>Download the CSV template</li>
              <li>Fill in your data in Excel or any editor</li>
              <li>Upload the CSV file</li>
              <li>Map columns to fields</li>
              <li>Review preview data</li>
              <li>Click Import</li>
            </ol>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold mb-4">Required Fields</h3>
            <ul className="text-sm space-y-1">
              {fieldMappings[importType].filter(f => f.required).map(field => (
                <li key={field.csv} className="text-red-600">
                  • {field.csv}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={handleImport}
            disabled={!file || importing}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? 'Importing...' : 'Start Import'}
          </button>
        </div>
      </div>
    </div>
  );
}
