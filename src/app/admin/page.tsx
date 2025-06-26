'use client';
import { useAuth } from "@/context/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAdminStats, searchContentForAdmin, flagContent } from "@/lib/data";
import { AdminStats, AdminSearchResult, Answer } from "@/lib/types";
import { Users, HelpCircle, Bot, Search, Loader2, Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ADMIN_EMAIL = 'chetamdavies@gmail.com';

const StatCard = ({ title, value, icon: Icon }: { title: string; value: React.ReactNode; icon: React.ElementType }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

export default function AdminPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [stats, setStats] = useState<AdminStats | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<AdminSearchResult[]>([]);
    const [isSearching, startSearchTransition] = useTransition();

    useEffect(() => {
        if (!loading && user?.email !== ADMIN_EMAIL) {
            router.push('/');
        }
        if (user?.email === ADMIN_EMAIL) {
            getAdminStats().then(setStats);
        }
    }, [user, loading, router]);

    const handleSearch = () => {
        if (!searchTerm) return;
        startSearchTransition(async () => {
            const results = await searchContentForAdmin(searchTerm);
            setSearchResults(results);
        });
    };

    const handleFlag = async (item: AdminSearchResult) => {
        try {
            await flagContent(item.type, item.id, item.type === 'answer' ? item.questionId : undefined);
            setSearchResults(prev => prev.map(r => r.id === item.id ? { ...r, isFlagged: true } : r));
            toast({ title: "Success", description: "Content has been flagged." });
        } catch (error) {
            toast({ title: "Error", description: "Could not flag content.", variant: "destructive" });
        }
    };

    if (loading || !user) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="container mx-auto py-8 space-y-8">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>

            <div className="grid gap-4 md:grid-cols-3">
                <StatCard title="Total Users" value={stats?.userCount ?? <Loader2 className="h-6 w-6 animate-spin" />} icon={Users} />
                <StatCard title="Total Questions" value={stats?.questionCount ?? <Loader2 className="h-6 w-6 animate-spin" />} icon={HelpCircle} />
                <StatCard title="Active Sage Users" value={stats?.sageUserCount ?? <Loader2 className="h-6 w-6 animate-spin" />} icon={Bot} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Content Moderation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Search for content to flag..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button onClick={handleSearch} disabled={isSearching}>
                            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            <span className="ml-2">Search</span>
                        </Button>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Content</TableHead>
                                    <TableHead>Author</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isSearching ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell>
                                    </TableRow>
                                ) : searchResults.length > 0 ? (
                                    searchResults.map((item) => (
                                        <TableRow key={`${item.type}-${item.id}`}>
                                            <TableCell className="capitalize">{item.type}</TableCell>
                                            <TableCell className="max-w-md truncate">{item.text}</TableCell>
                                            <TableCell>{item.user.name}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleFlag(item)}
                                                    disabled={item.isFlagged}
                                                >
                                                    <Flag className="h-4 w-4 mr-2" />
                                                    {item.isFlagged ? 'Flagged' : 'Flag'}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center">No results found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}