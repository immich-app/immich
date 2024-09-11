import React from 'react';

import { Button, ButtonProps } from '@react-email/components';

interface ImmichButtonProps extends ButtonProps {}

export const ImmichButton = ({ children, ...props }: ImmichButtonProps) => (
  <Button
    {...props}
    className="py-3 px-8 border bg-immich-primary rounded-full no-underline hover:no-underline text-white hover:text-gray-50 font-bold uppercase"
  >
    {children}
  </Button>
);
