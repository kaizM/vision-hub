import { InventoryCard } from '../InventoryCard';

export default function InventoryCardExample() {
  const mockInventory = [
    {
      id: "1",
      sku: "CIG-001",
      name: "Marlboro Red",
      count: 15,
      minThreshold: 10,
      lastCountTs: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    },
    {
      id: "2",
      sku: "CIG-002", 
      name: "Camel Blue",
      count: 8,
      minThreshold: 5,
      lastCountTs: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    },
    {
      id: "3",
      sku: "CIG-003",
      name: "Newport Menthol", 
      count: 3,
      minThreshold: 5,
      lastCountTs: new Date() // Today
    },
    {
      id: "4",
      sku: "MISC-001",
      name: "Lottery Tickets",
      count: 2,
      minThreshold: 20,
      lastCountTs: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    }
  ];

  const handleUpdateCount = (id: string, newCount: number, reason: string) => {
    console.log(`Updated inventory ${id}: count=${newCount}, reason=${reason}`);
  };

  const handleQuickCount = (id: string) => {
    console.log(`Quick count initiated for ${id}`);
  };

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
      {mockInventory.map(item => (
        <InventoryCard
          key={item.id}
          {...item}
          onUpdateCount={handleUpdateCount}
          onQuickCount={handleQuickCount}
        />
      ))}
    </div>
  );
}