'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { FileText, Download, Plus, Building, BarChart3, Calendar, CheckCircle, Settings, Trash2, ArrowLeft } from 'lucide-react'

interface ReportTemplate {
  id: string
  name: string
  description: string | null
  category: string
  isRegulatory: boolean
  regulatoryBody: string | null
}

interface ReportGeneration {
  id: string
  templateId: string
  status: string
  format: string
  createdAt: string
  completedAt: string | null
  recordCount: number | null
  template?: ReportTemplate
}

export default function ReportsPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [generations, setGenerations] = useState<ReportGeneration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const [filter, setFilter] = useState<string>('all')

  const [generateForm, setGenerateForm] = useState({
    templateId: '',
    academicYearId: '',
    termId: '',
    classId: '',
    format: 'PDF'
  })

  const [configForm, setConfigForm] = useState({
    name: '',
    description: '',
    category: 'CUSTOM',
    isRegulatory: false,
    regulatoryBody: ''
  })

  const [academicYears, setAcademicYears] = useState<any[]>([])
  const [terms, setTerms] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [templatesRes, generationsRes, yearsRes, termsRes, classesRes] = await Promise.all([
        fetch('/api/sms/reports/templates'),
        fetch('/api/sms/reports/generate'),
        fetch('/api/sms/academic-years'),
        fetch('/api/sms/terms'),
        fetch('/api/sms/academic-classes?limit=100')
      ])

      const templatesData = await templatesRes.json()
      const generationsData = await generationsRes.json()
      const yearsData = await yearsRes.json()
      const termsData = await termsRes.json()
      const classesData = await classesRes.json()

      // Handle different API response formats
      setTemplates(Array.isArray(templatesData) ? templatesData : templatesData?.data || [])
      setGenerations(Array.isArray(generationsData) ? generationsData : generationsData?.data || [])
      setAcademicYears(Array.isArray(yearsData) ? yearsData : yearsData?.data || [])
      setTerms(Array.isArray(termsData) ? termsData : termsData?.data || [])
      
      // Aggressive deduplication using Map
      const rawClasses = Array.isArray(classesData?.data) ? classesData.data : Array.isArray(classesData) ? classesData : []
      const classesMap = new Map()
      rawClasses.forEach((c: any) => {
        if (c.id && !classesMap.has(c.id)) {
          classesMap.set(c.id, c)
        }
      })
      setClasses(Array.from(classesMap.values()))
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!generateForm.templateId) {
      alert('Please select a report template')
      return
    }
    try {
      const res = await fetch('/api/sms/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: generateForm.templateId,
          parameters: {
            academicYearId: generateForm.academicYearId || null,
            termId: generateForm.termId || null,
            classId: generateForm.classId || null
          },
          format: generateForm.format
        })
      })

      const data = await res.json()
      console.log('Report generation response:', res.status, data)
      
      if (res.ok) {
        setGenerateDialogOpen(false)
        fetchData()
        setGenerateForm({
          templateId: '',
          academicYearId: '',
          termId: '',
          classId: '',
          format: 'PDF'
        })
        alert('Report generation started! Check the Generated Reports tab.')
      } else {
        alert('Error: ' + (data.error || 'Failed to generate report'))
      }
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Failed to generate report')
    }
  }

  const openGenerateDialog = (template: ReportTemplate) => {
    setSelectedTemplate(template)
    setGenerateForm({ ...generateForm, templateId: template.id })
    setGenerateDialogOpen(true)
  }

  const filteredTemplates = templates.filter(t => {
    if (filter === 'all') return true
    if (filter === 'regulatory') return t.isRegulatory
    if (filter === 'academic') return t.category === 'ACADEMIC'
    if (filter === 'finance') return t.category === 'FINANCE'
    return true
  })

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'REGULATORY': return 'bg-red-100 text-red-800'
      case 'ACADEMIC': return 'bg-blue-100 text-blue-800'
      case 'FINANCE': return 'bg-green-100 text-green-800'
      case 'ATTENDANCE': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Reports Center</h1>
          <p className="text-gray-500">Generate regulatory compliance and custom reports</p>
        </div>
        <Button variant="outline" onClick={() => setConfigDialogOpen(true)}>
          <Settings className="w-4 h-4 mr-2" /> Configure Reports
        </Button>
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Report Templates</TabsTrigger>
          <TabsTrigger value="generations">Generated Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <div className="flex gap-2 mb-4">
            <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>All</Button>
            <Button variant={filter === 'regulatory' ? 'default' : 'outline'} onClick={() => setFilter('regulatory')}>
              <Building className="w-4 h-4 mr-1" /> Regulatory
            </Button>
            <Button variant={filter === 'academic' ? 'default' : 'outline'} onClick={() => setFilter('academic')}>
              <BarChart3 className="w-4 h-4 mr-1" /> Academic
            </Button>
            <Button variant={filter === 'finance' ? 'default' : 'outline'} onClick={() => setFilter('finance')}>
              <FileText className="w-4 h-4 mr-1" /> Finance
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.isRegulatory && (
                      <Badge className="bg-red-500">
                        <Building className="w-3 h-3 mr-1" /> Regulatory
                      </Badge>
                    )}
                  </div>
                  <Badge className={getCategoryColor(template.category)}>{template.category}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                  {template.isRegulatory && template.regulatoryBody && (
                    <p className="text-xs text-gray-500 mb-4">For: {template.regulatoryBody.replace('_', ' ')}</p>
                  )}
                  <Button onClick={() => openGenerateDialog(template)} className="w-full">
                    <FileText className="w-4 h-4 mr-2" /> Generate Report
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-gray-500">
                No report templates found.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="generations">
          <Card>
            <CardHeader>
              <CardTitle>Generated Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {generations.map((gen) => (
                  <div key={gen.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{gen.template?.name || 'Report'}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{gen.format}</Badge>
                        <span className="text-sm text-gray-500">
                          {gen.recordCount ? `${gen.recordCount} records` : ''}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(gen.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {gen.status === 'COMPLETED' ? (
                        <>
                          <Badge className="bg-green-500">
                            <CheckCircle className="w-3 h-3 mr-1" /> Complete
                          </Badge>
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4 mr-1" /> Download
                          </Button>
                        </>
                      ) : gen.status === 'GENERATING' ? (
                        <Badge className="bg-blue-500">Generating...</Badge>
                      ) : (
                        <Badge variant="secondary">{gen.status}</Badge>
                      )}
                    </div>
                  </div>
                ))}
                {generations.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No reports generated yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generate Report Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate {selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <Label>Academic Year</Label>
              <Select
                value={generateForm.academicYearId}
                onValueChange={(v) => setGenerateForm({ ...generateForm, academicYearId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>{year.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Term</Label>
              <Select
                value={generateForm.termId}
                onValueChange={(v) => setGenerateForm({ ...generateForm, termId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((term) => (
                    <SelectItem key={term.id} value={term.id}>{term.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Class (Optional)</Label>
              <Select
                value={generateForm.classId}
                onValueChange={(v) => setGenerateForm({ ...generateForm, classId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Classes</SelectItem>
                  {classes.map((cls: any) => {
                    const fullClassName = cls.department 
                      ? `${cls.name}-${cls.department.code}${cls.section ? '-' + cls.section : ''}`
                      : cls.section 
                        ? `${cls.name}-${cls.section}`
                        : cls.name;
                    return (
                      <SelectItem key={cls.id} value={cls.id}>{fullClassName}</SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Format</Label>
              <Select
                value={generateForm.format}
                onValueChange={(v) => setGenerateForm({ ...generateForm, format: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="EXCEL">Excel</SelectItem>
                  <SelectItem value="CSV">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setGenerateDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Generate</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Configure Reports Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Report Templates</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3">Create Custom Report Template</h3>
              <form onSubmit={(e) => {
                e.preventDefault()
                // Submit to API
                fetch('/api/sms/reports/templates', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(configForm)
                }).then(() => {
                  setConfigDialogOpen(false)
                  fetchData()
                  setConfigForm({ name: '', description: '', category: 'CUSTOM', isRegulatory: false, regulatoryBody: '' })
                })
              }} className="space-y-3">
                <div>
                  <Label>Template Name</Label>
                  <Input 
                    value={configForm.name}
                    onChange={(e) => setConfigForm({...configForm, name: e.target.value})}
                    placeholder="e.g., Monthly Attendance Report"
                    required
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input 
                    value={configForm.description}
                    onChange={(e) => setConfigForm({...configForm, description: e.target.value})}
                    placeholder="What this report contains"
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select 
                    value={configForm.category}
                    onValueChange={(v) => setConfigForm({...configForm, category: v})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACADEMIC">Academic</SelectItem>
                      <SelectItem value="FINANCE">Finance</SelectItem>
                      <SelectItem value="ATTENDANCE">Attendance</SelectItem>
                      <SelectItem value="ENROLLMENT">Enrollment</SelectItem>
                      <SelectItem value="STAFF">Staff</SelectItem>
                      <SelectItem value="CUSTOM">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    id="isRegulatory"
                    checked={configForm.isRegulatory}
                    onChange={(e) => setConfigForm({...configForm, isRegulatory: e.target.checked})}
                  />
                  <Label htmlFor="isRegulatory">Regulatory Report</Label>
                </div>
                {configForm.isRegulatory && (
                  <div>
                    <Label>Regulatory Body</Label>
                    <Select 
                      value={configForm.regulatoryBody}
                      onValueChange={(v) => setConfigForm({...configForm, regulatoryBody: v})}
                    >
                      <SelectTrigger><SelectValue placeholder="Select body" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MINISTRY_OF_EDUCATION">Ministry of Education</SelectItem>
                        <SelectItem value="WAEC">WAEC</SelectItem>
                        <SelectItem value="NECO">NECO</SelectItem>
                        <SelectItem value="LGA">Local Government</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button type="submit" className="w-full">Create Template</Button>
              </form>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3">Existing Templates ({templates.length})</h3>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {templates.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium text-sm">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.category}</p>
                    </div>
                    {t.isRegulatory && <Badge className="bg-red-500 text-xs">Regulatory</Badge>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
