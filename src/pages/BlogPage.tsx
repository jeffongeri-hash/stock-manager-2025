import React from 'react';
import { AdSlot } from '@/components/AdSlot';

interface Props {
  src: string;
  title: string;
}

const BlogPage: React.FC<Props> = ({ src, title }) => (
  <>
  <iframe
    src={src}
    title={title}
    className="w-full border-0"
    style={{ height: '100vh' }}
    allow="clipboard-read; clipboard-write"
  />
  <div className="max-w-3xl mx-auto px-4"><AdSlot slot="blog-end" /></div>
  </>
);

export default BlogPage;
