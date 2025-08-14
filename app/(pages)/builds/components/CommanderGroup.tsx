import { forwardRef } from 'react';
import CommanderCard from './CommanderCard';

interface Props {
    letter: string;
    commanders: any[];
    expanded: Record<string, boolean>;
    toggleDetails: (name: string) => void;
}

const CommanderGroup = forwardRef<HTMLDivElement, Props>(
    ({ letter, commanders, expanded, toggleDetails }, ref) => (
        <div ref={ref}>
            <h2 className="text-xl font-bold text-orange-400 mb-2">{letter}</h2>
            <ul className="space-y-3">
                {commanders.map((c) => (
                    <CommanderCard
                        key={c.name}
                        commander={c}
                        expanded={expanded[c.name]}
                        toggleDetails={toggleDetails}
                    />
                ))}
            </ul>
        </div>
    )
);

CommanderGroup.displayName = 'CommanderGroup';
export default CommanderGroup;
