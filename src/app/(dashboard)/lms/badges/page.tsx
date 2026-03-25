'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import type { BadgeData, Tier, Student, BadgeFormData } from '@/types/badge';
import { getInitialBadgeForm } from '@/types/badge';
import BadgeForm from '@/components/badges/BadgeForm';
import BadgeCard from '@/components/badges/BadgeCard';
import AwardBadgeModal from '@/components/badges/AwardBadgeModal';

export default function BadgesPage() {
  const { toast } = useToast();
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<BadgeData | null>(null);
  const [filterTier, setFilterTier] = useState<string>('all');
  const [formData, setFormData] = useState<BadgeFormData>(getInitialBadgeForm());

  useEffect(() => {
    loadData();
  }, [filterTier]);

  async function loadData() {
    try {
      const [badgesRes, tiersRes, studentsRes] = await Promise.all([
        fetch(`/api/lms/badges${filterTier !== 'all' ? `?tierId=${filterTier}` : ''}`),
        fetch('/api/sms/tiers'),
        fetch('/api/sms/students'),
      ]);

      const badgesData = await badgesRes.json();
      const tiersData = await tiersRes.json();
      const studentsData = await studentsRes.json();

      setBadges(badgesData || []);
      setTiers(tiersData.data || []);
      setStudents(studentsData.students || studentsData.data?.students || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/lms/badges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tierId: formData.isGlobal ? null : formData.tierId || null,
        }),
      });

      if (res.ok) {
        toast({ title: 'Badge created successfully' });
        setShowForm(false);
        setFormData(getInitialBadgeForm());
        loadData();
      } else {
        const data = await res.json();
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to create badge', variant: 'destructive' });
    }
  }

  async function handleAwardBadge(studentId: string) {
    if (!selectedBadge) return;

    try {
      const res = await fetch(`/api/lms/badges/award/${studentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badgeId: selectedBadge.id }),
      });

      if (res.ok) {
        toast({ title: 'Badge awarded successfully!' });
        setShowAwardModal(false);
        setSelectedBadge(null);
        loadData();
      } else {
        const data = await res.json();
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to award badge', variant: 'destructive' });
    }
  }

  const globalBadges = badges.filter(b => b.isGlobal);
  const tierBadges = badges.filter(b => !b.isGlobal);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Badges & Achievements</h1>
          <p className="text-gray-600">Manage achievement badges across all tiers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAwardModal(true)}>
            Award Badge
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Create Badge'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Select value={filterTier} onValueChange={setFilterTier}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            {tiers.map((tier) => (
              <SelectItem key={tier.id} value={tier.id}>
                {tier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-500">
          {badges.length} badge{badges.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Create Badge Form */}
      {showForm && (
        <BadgeForm
          formData={formData}
          onChange={setFormData}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setFormData(getInitialBadgeForm());
          }}
          tiers={tiers}
        />
      )}

      {/* Badges Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          {/* Global Badges */}
          {globalBadges.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span>🌐</span> Global Badges (All Tiers)
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {globalBadges.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} />
                ))}
              </div>
            </div>
          )}

          {/* Tier-Specific Badges */}
          {tierBadges.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span>🎯</span> Tier-Specific Badges
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {tierBadges.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} />
                ))}
              </div>
            </div>
          )}

          {badges.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                No badges created yet. Click &quot;Create Badge&quot; to add your first badge.
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Award Badge Modal */}
      <AwardBadgeModal
        open={showAwardModal}
        badges={badges}
        students={students}
        selectedBadge={selectedBadge}
        onSelectBadge={setSelectedBadge}
        onAward={handleAwardBadge}
        onClose={() => {
          setShowAwardModal(false);
          setSelectedBadge(null);
        }}
      />
    </div>
  );
}
