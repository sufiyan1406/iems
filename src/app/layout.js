import './globals.css';

export const metadata = {
  title: 'IEMS - Integrated Education Management System',
  description: 'AI-Driven Autonomous Academic Operating System for intelligent institutional governance',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
