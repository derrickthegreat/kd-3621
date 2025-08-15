interface Props {
    letters: string[];
    activeLetter: string | null;
    onClickLetter: (letter: string) => void;
}

export default function AlphabetSidebar({ letters, activeLetter, onClickLetter }: Props) {
    return (
        <aside className="col-span-1 hidden md:block">
            <div className="sticky top-1/2 transform -translate-y-1/3 flex flex-col items-center gap-1 text-sm font-bold w-full">
                {letters.map((letter) => (
                    <button
                        key={letter}
                        onClick={() => onClickLetter(letter)}
                        className={`transition ${
                            activeLetter === letter
                                ? 'text-orange-400 scale-110'
                                : 'text-gray-400 hover:text-orange-400'
                        }`}
                    >
                        {letter}
                    </button>
                ))}
            </div>
        </aside>
    );
}
