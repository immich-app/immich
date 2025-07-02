import React from 'react';

import { Button, ButtonProps } from '@react-email/components';

export const ImmichButton = ({ children, ...props }: ButtonProps) => (
  <Button
    {...props}
    className="py-3 px-8 border bg-immich-primary rounded-full no-underline hover:no-underline text-white hover:text-gray-50 font-bold uppercase"
  >
    {children}
  </Button>
);
