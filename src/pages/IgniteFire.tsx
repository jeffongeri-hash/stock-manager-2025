import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Flame } from 'lucide-react';

const IgniteFire = () => {
  return (
    <PageLayout title="IgniteFIRE Suite">
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Flame className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">IgniteFIRE Suite</h2>
        <p className="text-muted-foreground">Components pending upload. Please provide the updated files.</p>
      </div>
    </PageLayout>
  );
};

export default IgniteFire;
