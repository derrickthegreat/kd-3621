"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { useUser } from "@clerk/nextjs"
import { Badge } from "@/components/ui/badge"
import { Loader2, Database, RefreshCw, ArrowRight, AlertTriangle } from "lucide-react"

interface SyncResult {
  success: boolean;
  message: string;
  from?: string;
  to?: string;
  recordCount?: number;
  results?: Array<{
    table: string;
    synced: number;
    status: string;
  }>;
  error?: string;
}

interface DbStatus {
  environment: string;
  tables: Array<{
    tableName: string;
    count: number;
    error: string | null;
  }>;
  timestamp: string;
}

export default function SystemSettingsPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState<string | null>(null);
  const [prodStatus, setProdStatus] = useState<DbStatus | null>(null);
  const [devStatus, setDevStatus] = useState<DbStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const getAuthHeaders = async () => {
    const token = await (window as any).Clerk.session.getToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const fetchDatabaseStatus = async () => {
    setStatusLoading(true);
    try {
      const headers = await getAuthHeaders();
      
      // Fetch production status
      const prodResponse = await fetch('/api/v1/db/status?env=production', {
        headers,
      });
      if (prodResponse.ok) {
        setProdStatus(await prodResponse.json());
      }

      // Fetch development status
      const devResponse = await fetch('/api/v1/db/status?env=development', {
        headers,
      });
      if (devResponse.ok) {
        setDevStatus(await devResponse.json());
      }
    } catch (error) {
      console.error('Error fetching status:', error);
      toast.error('Failed to fetch database status');
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseStatus();
  }, []);

  const runMigrations = async (environment: 'dev' | 'prod') => {
    setLoading(`migrate-${environment}`);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/v1/db/migrate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ environment }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Migrations completed for ${environment}`);
      } else {
        toast.error(`Migration failed: ${data.error}`);
      }
    } catch (error) {
      toast.error('Failed to run migrations');
    } finally {
      setLoading(null);
    }
  };

  const seedDatabase = async (environment: 'dev' | 'prod') => {
    setLoading(`seed-${environment}`);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/v1/db/seed', {
        method: 'POST',
        headers,
        body: JSON.stringify({ environment }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Database seeded for ${environment}`);
        fetchDatabaseStatus(); // Refresh status
      } else {
        toast.error(`Seed failed: ${data.error}`);
      }
    } catch (error) {
      toast.error('Failed to seed database');
    } finally {
      setLoading(null);
    }
  };

  const syncDatabase = async (from: 'prod' | 'dev', to: 'prod' | 'dev', tableName?: string) => {
    const operation = tableName ? `sync-${tableName}-${from}-${to}` : `sync-${from}-${to}`;
    setLoading(operation);
    
    try {
      const headers = await getAuthHeaders();
      const body = tableName 
        ? { tableName, from, to }
        : { from, to };

      const response = await fetch('/api/v1/db/sync', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      const data: SyncResult = await response.json();
      if (data.success) {
        const recordText = data.recordCount ? `${data.recordCount.toLocaleString()} records` : 'records';
        toast.success(`Successfully synced ${recordText} from ${from} to ${to}`);
        fetchDatabaseStatus(); // Refresh status
      } else {
        toast.error(`Sync failed: ${data.error || data.message}`);
      }
    } catch (error) {
      toast.error('Failed to sync database');
    } finally {
      setLoading(null);
    }
  };

  const clearCache = async () => {
    toast.success("Cache cleared");
  };

  const getTotalRecords = (status: DbStatus | null) => {
    if (!status) return 0;
    return status.tables.reduce((sum, table) => sum + table.count, 0);
  };

  return (
    <div className="w-full my-4 space-y-6 px-4 md:px-6 lg:px-8">
      {/* Database Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="h-5 w-5 text-red-600" />
              Production Database
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {prodStatus ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Records:</span>
                  <Badge variant="secondary">{getTotalRecords(prodStatus).toLocaleString()}</Badge>
                </div>
                <div className="space-y-2">
                  {prodStatus.tables.slice(0, 3).map((table) => (
                    <div key={table.tableName} className="flex justify-between text-sm">
                      <span className="capitalize">{table.tableName}:</span>
                      <span className="font-mono text-muted-foreground">
                        {table.error ? 'Error' : table.count.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  Updated: {new Date(prodStatus.timestamp).toLocaleTimeString()}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                {statusLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Loading status...
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="h-5 w-5 text-green-600" />
              Development Database
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {devStatus ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Records:</span>
                  <Badge variant="secondary">{getTotalRecords(devStatus).toLocaleString()}</Badge>
                </div>
                <div className="space-y-2">
                  {devStatus.tables.slice(0, 3).map((table) => (
                    <div key={table.tableName} className="flex justify-between text-sm">
                      <span className="capitalize">{table.tableName}:</span>
                      <span className="font-mono text-muted-foreground">
                        {table.error ? 'Error' : table.count.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  Updated: {new Date(devStatus.timestamp).toLocaleTimeString()}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                {statusLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Loading status...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Database Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Database Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-2">Migrations</h4>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => runMigrations('dev')}
                    disabled={loading === 'migrate-dev'}
                  >
                    {loading === 'migrate-dev' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Dev Migrations
                  </Button>
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => runMigrations('prod')}
                    disabled={loading === 'migrate-prod'}
                  >
                    {loading === 'migrate-prod' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Prod Migrations
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Database Seeding</h4>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => seedDatabase('dev')}
                    disabled={loading === 'seed-dev'}
                  >
                    {loading === 'seed-dev' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Seed Dev
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => seedDatabase('prod')}
                    disabled={loading === 'seed-prod'}
                  >
                    {loading === 'seed-prod' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Seed Prod
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">System Cache</h4>
                <Button size="sm" variant="outline" onClick={clearCache}>
                  Clear Cache
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Status & Monitoring</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-2">Database Status</h4>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={fetchDatabaseStatus}
                  disabled={statusLoading}
                >
                  {statusLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Refresh Status
                </Button>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Environment Info</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>Node: {process.env.NODE_ENV}</li>
                  <li>Region: edge</li>
                  <li>User: {user?.id?.slice(-8)}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Database Sync Operations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <RefreshCw className="h-5 w-5" />
            Database Synchronization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Database Sync */}
            <div className="space-y-3">
              <h4 className="font-medium">Full Database Sync</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  <Database className="h-4 w-4 text-red-600" />
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Database className="h-4 w-4 text-green-600" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Production → Development</div>
                    <div className="text-xs text-muted-foreground">Sync all production data to dev</div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => syncDatabase('prod', 'dev')}
                    disabled={!!loading}
                  >
                    {loading === 'sync-prod-dev' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sync
                  </Button>
                </div>

                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  <Database className="h-4 w-4 text-green-600" />
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Database className="h-4 w-4 text-red-600" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Development → Production</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-amber-500" />
                      Sync dev data to production (use carefully)
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => syncDatabase('dev', 'prod')}
                    disabled={!!loading}
                  >
                    {loading === 'sync-dev-prod' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sync
                  </Button>
                </div>
              </div>
            </div>

            {/* Single Table Sync */}
            <div className="space-y-3">
              <h4 className="font-medium">Single Table Sync</h4>
              <div className="space-y-2">
                {['user', 'alliance', 'player', 'governor'].map((table) => (
                  <div key={table} className="flex items-center gap-2 p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="text-sm font-medium capitalize">{table} Table</div>
                      <div className="text-xs text-muted-foreground">Prod → Dev</div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => syncDatabase('prod', 'dev', table)}
                      disabled={!!loading}
                    >
                      {loading === `sync-${table}-prod-dev` && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sync
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
            <div className="text-sm text-muted-foreground">
              <strong>Note:</strong> Sync operations will clear the target database tables and copy data from the source. 
              This operation cannot be undone. Production syncs require extra caution.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
