'use client'
import { useUser } from "@clerk/nextjs";

interface PublicMetadata {
    role?: string,
    rokId?: string
}

export default function AdminPage() {
    const { isLoaded, user } = useUser();

    if(!isLoaded) {
        return null;
    }
    const userMetadata = user?.publicMetadata as PublicMetadata
    if (userMetadata.role !== 'Admin') return <p>Not Allowed.</p>;

    return (
        <>
            <h1>Admin Page</h1>
            <div className="h-full w-full flex flex-col gap-4 items-center">
                <h2 className="text-xl font-bold">Current Admin</h2>
                <p>Name: {user?.fullName as string}</p>
                <p>Role: {userMetadata.role}</p>
                <p>Governor ID: {userMetadata.rokId}</p>
            </div>
        </>
    )
};
