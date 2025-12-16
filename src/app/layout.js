import "./globals.css";

export const metadata = {
  title: "MOODic",
  description: "Feel the music that matches your mood.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
