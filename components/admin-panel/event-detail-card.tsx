import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export type EventDetailsCardProps = {
  event: {
    id: string;
    name: string;
    startDate: string;
    endDate?: string | null;
    description?: string | null;
    isArchived?: boolean;
  };
  editMode: boolean;
  name: string;
  startDate: string;
  endDate: string;
  description: string;
  loading?: boolean;
  error?: string | null;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (e: React.FormEvent) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
  onChangeName: (v: string) => void;
  onChangeStartDate: (v: string) => void;
  onChangeEndDate: (v: string) => void;
  onChangeDescription: (v: string) => void;
  onArchive?: () => void;
  onUnarchive?: () => void;
};

export function EventDetailsCard({
  event,
  editMode,
  name,
  startDate,
  endDate,
  description,
  loading,
  error,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onBack,
  onChangeName,
  onChangeStartDate,
  onChangeEndDate,
  onChangeDescription,
  onArchive,
  onUnarchive,
}: EventDetailsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{event.isArchived ? 'Archived Event Details' : 'Event Details'}</CardTitle>
      </CardHeader>
      <CardContent>
        {editMode ? (
          <form onSubmit={onSave} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4">
              <Input type="text" value={name} onChange={e => onChangeName(e.target.value)} required placeholder="Event Name" />
              <div className="flex gap-4">
                <Input type="date" value={startDate} onChange={e => onChangeStartDate(e.target.value)} required placeholder="Start Date" />
                <Input type="date" value={endDate} onChange={e => onChangeEndDate(e.target.value)} placeholder="End Date" />
              </div>
              <Textarea value={description} onChange={e => onChangeDescription(e.target.value)} placeholder="Description" rows={3} />
            </div>
            {error && <p className="text-red-500">{error}</p>}
            <div className="flex gap-2 justify-end">
              <Button type="submit" className="cursor-pointer">{loading ? 'Saving...' : 'Save Changes'}</Button>
              <Button type="button" variant="secondary" className="cursor-pointer" onClick={onCancelEdit}>Cancel</Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <span className="font-semibold">Name:</span>
              <span>{event.name || 'N/A'}</span>
              <span className="font-semibold">Start Date:</span>
              <span>{event.startDate ? event.startDate.slice(0, 10) : 'N/A'}</span>
              <span className="font-semibold">End Date:</span>
              <span>{event.endDate ? event.endDate.slice(0, 10) : 'N/A'}</span>
              <span className="font-semibold">Description:</span>
              <span>{event.description || 'N/A'}</span>
            </div>
            <div className="flex gap-2 justify-end">
              <Button className="cursor-pointer" onClick={onEdit}>Edit</Button>
              {event.isArchived ? (
                <Button className="cursor-pointer bg-green-500 hover:bg-green-600 text-white" onClick={onUnarchive}>
                  Unarchive
                </Button>
              ) : (
                <Button className="cursor-pointer bg-yellow-500 hover:bg-yellow-600 text-white" onClick={onArchive}>
                  Archive
                </Button>
              )}
              <Button variant="destructive" className="cursor-pointer" onClick={() => onDelete(event.id)}>Delete</Button>
              <Button variant="secondary" className="cursor-pointer" onClick={onBack}>Back</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
