"use client";

interface PrintableGroceryListProps {
  items: Array<{
    ingredient: string;
    amount: string | null;
    unit: string | null;
    category: string | null;
    isChecked: boolean;
  }>;
  checkedCount: number;
  totalCount: number;
}

const CATEGORY_ORDER = ["produce", "meat", "dairy", "pantry", "other"];
const CATEGORY_LABELS: Record<string, string> = {
  produce: "Produce",
  meat: "Meat & Seafood",
  dairy: "Dairy & Eggs",
  pantry: "Pantry",
  other: "Other",
};

export default function PrintableGroceryList({
  items,
  checkedCount,
  totalCount,
}: PrintableGroceryListProps) {
  const itemsByCategory = items.reduce(
    (acc, item) => {
      const category = item.category || "other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    },
    {} as Record<string, typeof items>,
  );

  const sortedCategories = CATEGORY_ORDER.filter(
    (cat) => itemsByCategory[cat]?.length > 0,
  );

  return (
    <>
      <style jsx global>{`
        /* Screen: hide print content */
        .print-only {
          display: none;
        }

        @media print {
          /* Hide the app shell */
          .no-print {
            display: none !important;
          }

          /* Show print content */
          .print-only {
            display: block !important;
          }

          /* Reset layout quirks */
          html,
          body {
            height: auto !important;
            overflow: visible !important;
          }

          @page {
            margin: 0.5in;
            size: letter;
          }
        }
      `}</style>

      <div className="print-only">
        {/* Header */}
        <div
          style={{
            marginBottom: "24px",
            borderBottom: "2px solid #000",
            paddingBottom: "12px",
          }}
        >
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              margin: 0,
              marginBottom: "8px",
            }}
          >
            Grocery List
          </h1>
          <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>
            {checkedCount} of {totalCount} items checked
          </p>
        </div>

        {/* Categories */}
        {sortedCategories.map((category) => (
          <div
            key={category}
            style={{ marginBottom: "24px", pageBreakInside: "avoid" }}
          >
            <h2
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "12px",
              }}
            >
              {CATEGORY_LABELS[category]} ({itemsByCategory[category].length})
            </h2>
            {itemsByCategory[category].map((item, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: "8px",
                  paddingLeft: "24px",
                  position: "relative",
                  textDecoration: item.isChecked ? "line-through" : "none",
                  opacity: item.isChecked ? 0.5 : 1,
                  fontSize: "14px",
                }}
              >
                <span
                  style={{ position: "absolute", left: 0, fontSize: "16px" }}
                >
                  {item.isChecked ? "☑" : "☐"}
                </span>
                {item.amount && `${item.amount} `}
                {item.unit && `${item.unit} `}
                {item.ingredient}
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
