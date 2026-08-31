"use client";

interface FilterSidebarProps {
  categories: string[];
  selectedCategory: string | null;
  selectedPricing: string | null;
  onCategoryChange: (category: string | null) => void;
  onPricingChange: (pricing: string | null) => void;
}

const pricingOptions = [
  { value: "free", label: "Free" },
  { value: "freemium", label: "Freemium" },
  { value: "paid", label: "Paid" },
  { value: "open-source", label: "Open Source" },
  { value: "enterprise", label: "Enterprise" },
];

export function FilterSidebar({
  categories,
  selectedCategory,
  selectedPricing,
  onCategoryChange,
  onPricingChange,
}: FilterSidebarProps) {
  return (
    <aside className="w-52 flex-shrink-0 hidden lg:block">
      <div className="sticky top-6 space-y-8">
        {/* Categories */}
        <div>
          <h3 className="section-title mb-3 px-2">Category</h3>
          <div className="space-y-0.5">
            <FilterButton
              active={!selectedCategory}
              onClick={() => onCategoryChange(null)}
            >
              All
            </FilterButton>
            {categories.map((category) => (
              <FilterButton
                key={category}
                active={selectedCategory === category}
                onClick={() => onCategoryChange(category)}
              >
                {category}
              </FilterButton>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div>
          <h3 className="section-title mb-3 px-2">Pricing</h3>
          <div className="space-y-0.5">
            <FilterButton
              active={!selectedPricing}
              onClick={() => onPricingChange(null)}
            >
              All
            </FilterButton>
            {pricingOptions.map((option) => (
              <FilterButton
                key={option.value}
                active={selectedPricing === option.value}
                onClick={() => onPricingChange(option.value)}
              >
                {option.label}
              </FilterButton>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all ${
        active
          ? "bg-gray-900 text-white font-medium"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}
