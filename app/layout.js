import './globals.css';
import './custom.css';

export const metadata = {
    title: 'Task Management System',
    description: 'A task management system for small teams',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <div className="min-h-screen bg-gray-50">
                    {children}
                </div>
            </body>
        </html>
    );
} 