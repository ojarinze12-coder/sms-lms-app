'use client';

import { Users, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MoreVertical, Pencil, Trash2, Search } from 'lucide-react';
import { staffCategories, categoryLabels, statusColors, type Staff } from '@/types/staff';

interface StaffTableProps {
  staff: Staff[];
  search: string;
  filterCategory: string;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: string) => void;
  onEdit: (staff: Staff) => void;
  onDelete: (id: string) => void;
  onAddClick: () => void;
}

export default function StaffTable({
  staff,
  search,
  filterCategory,
  onSearchChange,
  onFilterChange,
  onEdit,
  onDelete,
  onAddClick,
}: StaffTableProps) {
  const filteredStaff = staff.filter(s => {
    const matchesSearch = !search || 
      s.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      s.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      s.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = !filterCategory || s.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Staff Directory</CardTitle>
            <CardDescription>View and manage all non-teaching staff</CardDescription>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search staff..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-8 w-full sm:w-[200px]"
              />
            </div>
            <Select value={filterCategory || 'all'} onValueChange={(v) => onFilterChange(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {staffCategories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredStaff.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p>No staff members found</p>
            <Button variant="outline" className="mt-4" onClick={onAddClick}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add First Staff
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Employee</th>
                  <th className="text-left py-3 px-4 font-medium">ID</th>
                  <th className="text-left py-3 px-4 font-medium">Category</th>
                  <th className="text-left py-3 px-4 font-medium">Branch</th>
                  <th className="text-left py-3 px-4 font-medium">Department</th>
                  <th className="text-left py-3 px-4 font-medium">Position</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((staffMember) => (
                  <tr key={staffMember.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">
                          {staffMember.firstName} {staffMember.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{staffMember.email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">{staffMember.employeeId}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">
                        {categoryLabels[staffMember.category] || staffMember.category}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {staffMember.branch?.name || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm">{staffMember.department || '-'}</td>
                    <td className="py-3 px-4 text-sm">{staffMember.position || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[staffMember.status] || 'bg-gray-100 text-gray-700'}`}>
                        {staffMember.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(staffMember)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onDelete(staffMember.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
