'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BadgeFormData, Tier } from '@/types/badge';
import { BADGE_ICONS } from '@/types/badge';

interface BadgeFormProps {
  formData: BadgeFormData;
  onChange: (data: BadgeFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  tiers: Tier[];
}

export default function BadgeForm({ formData, onChange, onSubmit, onCancel, tiers }: BadgeFormProps) {
  return (
    <Card>
      <CardHeader><CardTitle>Create New Badge</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Badge Name"
              value={formData.name}
              onChange={e => onChange({ ...formData, name: e.target.value })}
              required
            />
            <Input
              placeholder="Points"
              type="number"
              value={formData.points}
              onChange={e => onChange({ ...formData, points: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Badge Icon</label>
              <Select value={formData.icon} onValueChange={(v) => onChange({ ...formData, icon: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <div className="grid grid-cols-6 gap-1 p-2">
                    {BADGE_ICONS.map((icon) => (
                      <button
                        key={icon.value}
                        type="button"
                        onClick={() => onChange({ ...formData, icon: icon.value })}
                        className={`p-2 text-xl rounded hover:bg-gray-100 ${
                          formData.icon === icon.value ? 'bg-blue-100 ring-2 ring-blue-500' : ''
                        }`}
                        title={icon.label}
                      >
                        {icon.value}
                      </button>
                    ))}
                  </div>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isGlobal}
                  onChange={e => onChange({ ...formData, isGlobal: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Global (all tiers)</span>
              </label>

              {!formData.isGlobal && (
                <Select
                  value={formData.tierId}
                  onValueChange={v => onChange({ ...formData, tierId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Tier" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiers.map((tier) => (
                      <SelectItem key={tier.id} value={tier.id}>
                        {tier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <textarea
            className="border rounded w-full p-2"
            placeholder="Description"
            value={formData.description}
            onChange={e => onChange({ ...formData, description: e.target.value })}
          />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">Create Badge</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
