'use client'

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { AppBreadcrumbs } from './(components)/layout/AppBeadcrumbs';

export default function AdminPage() {
    const { userId, getToken } = useAuth();
    const [userdata, setUserData] = useState<any>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!userId) return;

            try {
                const token = await getToken();
                const res = await fetch(`/api/v1/users/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.message || 'Failed to fetch user data.');
                }

                const data = await res.json();
                setUserData(data);
            } catch (e) {
                console.error('Error fetching user data:', e);
            }
        };

        fetchUserData();
        console.log(userdata)
    }, [userId]);

    if (!userId) return <div>You must be signed in.</div>;

    return (
        <>
            <AppBreadcrumbs items={[{title: "Admin" }]} />
            <div className="h-full w-full flex flex-col gap-4 items-center">
                <h2 className="text-xl font-bold">Current Admin</h2>
                {userdata ? (
                    <>
                        <p>Name: {userdata.user?.firstName} {userdata.user?.lastName}</p>
                        <p>Role: {userdata.user?.publicMetadata?.role || 'N/A'}</p>
                        <p>Governor Name: {userdata.governors?.[0]?.name || 'N/A'}</p>
                        <p>Governor ID: {userdata.governors?.[0]?.rokId || 'N/A'}</p>
                        <p>Alliance: {userdata.governors?.[0].alliance.name}</p>
                    </>
                ) : (
                    <p>Loading user data...</p>
                )}
            </div>
        </>
    );
}

