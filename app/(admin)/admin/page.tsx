'use client'
import { useUser } from "@clerk/nextjs";

export default function AdminPage() {
    const { isLoaded, user } = useUser();

    if(!isLoaded) {
        return null;
    }
    if (user?.publicMetadata.role !== 'Admin') return <p>Not Allowed.</p>;

    return (
        <>
            <h1>Admin Page</h1>
            <div className="h-full w-full flex flex-col gap-4 items-center">
                <h2 className="text-xl font-bold">Current Admin</h2>
                <p>Name: {user?.fullName}</p>
                <p>Role: {user?.publicMetadata.role}</p>
                <p>Governor ID: {user?.publicMetadata.rokId}</p>
            </div>
        </>
    )
};
