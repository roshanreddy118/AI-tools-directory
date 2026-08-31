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
    <aside className="w-64 flex-shrink-0">
      <div className="sticky top-4 space-y-6">
        {/* Categories */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
            Category
          </h3>
          <div className="space-y-1">
            <button
              onClick={() => onCategoryChange(null)}
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                !selectedCategory
                  ? "bg-primary-50 text-primary-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => onCategoryChange(category)}
                className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedCategory === category
                    ? "bg-primary-50 text-primary-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
            Pricing
          </h3>
          <div className="space-y-1">
            <button
              onClick={() => onPricingChange(null)}
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                !selectedPricing
                  ? "bg-primary-50 text-primary-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              All Pricing
            </button>
            {pricingOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onPricingChange(option.value)}
                className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedPricing === option.value
                    ? "bg-primary-50 text-primary-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
