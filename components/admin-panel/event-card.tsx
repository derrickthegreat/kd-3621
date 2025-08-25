import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye, RotateCcw, Trash2 } from 'lucide-react';

export type EventCardProps = {
  id: string;
  name: string;
  startDate: string;
  endDate?: string | null;
  description?: string | null;
  isArchived?: boolean;
  onDelete?: (id: string) => void;
  onUnarchive?: (id: string) => void;
};

export function EventCard({ id, name, startDate, endDate, description, isArchived, onDelete, onUnarchive }: EventCardProps) {
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
      <div className="flex items-center justify-end gap-2 px-6 pb-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" asChild aria-label="View">
              <Link href={`/admin/events/${id}`}>
                <Eye className="size-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>View</TooltipContent>
        </Tooltip>
        {isArchived && onUnarchive && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Unarchive" onClick={() => onUnarchive(id)}>
                <RotateCcw className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Unarchive</TooltipContent>
          </Tooltip>
        )}
        {onDelete && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => onDelete(id)}>
                <Trash2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        )}
      </div>
    </Card>
  );
}
