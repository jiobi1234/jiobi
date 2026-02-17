'use client';

import { NextIntlClientProvider } from 'next-intl';

interface IntlProviderProps {
  locale: string;
  messages: any;
  children: React.ReactNode;
}

export default function IntlProvider({ locale, messages, children }: IntlProviderProps) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone="Asia/Seoul" // 전역 기본 타임존 설정
    >
      {children}
    </NextIntlClientProvider>
  );
}
