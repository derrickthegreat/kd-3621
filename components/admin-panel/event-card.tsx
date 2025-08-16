import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';

export type EventCardProps = {
  id: string;
  name: string;
  startDate: string;
  endDate?: string | null;
  description?: string | null;
  isArchived?: boolean;
  onDelete?: (id: string) => void;
};

export function EventCard({ id, name, startDate, endDate, description, isArchived, onDelete }: EventCardProps) {
  return (
    <Card className="flex flex-col justify-between h-full">
      <CardHeader>
        <CardTitle className="truncate">{name}</CardTitle>
        <div className="text-xs text-muted-foreground mt-1">
          {format(new Date(startDate), 'yyyy-MM-dd')}
          {endDate && ` - ${format(new Date(endDate), 'yyyy-MM-dd')}`}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-2 line-clamp-3">{description || 'No description.'}</p>
      </CardContent>
      <div className="flex gap-2 px-6 pb-4">
        <Link href={`/admin/events/${id}`} className="flex-1">
          <Button size="sm" className="w-full cursor-pointer">View / Edit</Button>
        </Link>
        {onDelete && (
          <Button
            size="sm"
            variant="destructive"
            className="cursor-pointer"
            onClick={() => onDelete(id)}
          >
            Delete
          </Button>
        )}
      </div>
    </Card>
  );
}
