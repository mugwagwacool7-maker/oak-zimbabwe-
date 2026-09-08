import './globals.css';

export const metadata = {
  title: 'OAK Foundation — Partner Convening 2026',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=chillax@400,500,600,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-chillax bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
