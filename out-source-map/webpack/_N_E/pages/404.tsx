import Error from 'next/error';
import React from 'react';

export default function NotFound(): JSX.Element {
  return <Error statusCode={404} />;
}
