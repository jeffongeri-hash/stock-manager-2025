import React from 'react';

interface Props {
  src: string;
  title: string;
}

const BlogPage: React.FC<Props> = ({ src, title }) => (
  <iframe
    src={src}
    title={title}
    className="w-full border-0"
    style={{ height: '100vh' }}
    allow="clipboard-read; clipboard-write"
  />
);

export default BlogPage;
