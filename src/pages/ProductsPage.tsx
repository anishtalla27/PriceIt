import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Edit3, Eye, PackagePlus, Plus, Trash2 } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import {
  deleteSavedProduct,
  duplicateSavedProduct,
  getSavedProductStatus,
  hasMeaningfulProductData,
  readSavedProducts,
  saveCurrentProduct,
  type SavedProduct,
} from "@/lib/saved-products";
import logo from "../../logo.png";

function money(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function fmtDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function statusClasses(status: ReturnType<typeof getSavedProductStatus>): string {
  if (status === "Profitable") return "bg-[#28A66A] text-white";
  if (status === "Needs work") return "bg-[#E1603F] text-white";
  return "bg-[#F0A92E] text-white";
}

function ProductCard({
  product,
  onOpen,
  onDuplicate,
  onDelete,
  onResults,
}: {
  product: SavedProduct;
  onOpen: (product: SavedProduct) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onResults: (product: SavedProduct) => void;
}) {
  const status = getSavedProductStatus(product);
  const description = product.productInfo.productDescription.trim() || "No description added yet.";
  const canViewResults = product.summary.sellingPrice > 0 && Number(product.pricing.unitsPerMonth) > 0;

  return (
    <article className="rounded-2xl border border-[#D0EAF0] bg-white px-5 py-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-extrabold leading-tight text-[#2B2B2B]">
              {product.productInfo.productName || "Untitled product"}
            </h2>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${statusClasses(status)}`}>
              {status}
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#4F747C]">{description}</p>
          <p className="mt-2 text-xs font-semibold text-[#71939B]">Last updated {fmtDate(product.updatedAt)}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-[#EAF7FB] px-3 py-3">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#0E92A3]">Price</p>
          <p className="mt-1 text-lg font-extrabold text-[#2B2B2B]">{money(product.summary.sellingPrice)}</p>
        </div>
        <div className="rounded-xl bg-[#F3F8F4] px-3 py-3">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#24784F]">Profit/unit</p>
          <p className="mt-1 text-lg font-extrabold text-[#2B2B2B]">{money(product.summary.profitPerUnit)}</p>
        </div>
        <div className="rounded-xl bg-[#FFF5E8] px-3 py-3">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#9A5A12]">Monthly profit</p>
          <p className="mt-1 text-lg font-extrabold text-[#2B2B2B]">{money(product.summary.monthlyProfit)}</p>
        </div>
        <div className="rounded-xl bg-[#F8FBFC] px-3 py-3">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#4F747C]">Break-even</p>
          <p className="mt-1 text-lg font-extrabold text-[#2B2B2B]">
            {product.summary.breakEvenUnits === null ? "Not yet" : `${product.summary.breakEvenUnits} units`}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onOpen(product)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0E92A3] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#0A7685]"
        >
          <Edit3 className="h-4 w-4" />
          Open / Edit
        </button>
        <button
          type="button"
          onClick={() => onDuplicate(product.id)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#E1603F] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#C94E32]"
        >
          <Copy className="h-4 w-4" />
          Duplicate
        </button>
        <button
          type="button"
          onClick={() => onDelete(product.id)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#D84A40] px-4 py-2 text-sm font-bold text-white transition hover:bg-red-600"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
        {canViewResults && (
          <button
            type="button"
            onClick={() => onResults(product)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#F0A92E] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#D99119]"
          >
            <Eye className="h-4 w-4" />
            View Results
          </button>
        )}
      </div>
    </article>
  );
}

export default function ProductsPage() {
  const navigate = useNavigate();
  const { state, loadSavedProduct, setActiveSavedProductId } = useAppState();
  const [products, setProducts] = useState<SavedProduct[]>(() => readSavedProducts());
  const productCountLabel = useMemo(() => {
    if (products.length === 1) return "1 saved product";
    return `${products.length} saved products`;
  }, [products.length]);

  const refreshProducts = () => setProducts(readSavedProducts());

  const handleAddAnother = () => {
    const saved = saveCurrentProduct(state, { existingId: state.activeSavedProductId });
    if (saved) setActiveSavedProductId(saved.id);
    refreshProducts();
    navigate("/create");
  };

  const handleOpen = (product: SavedProduct) => {
    loadSavedProduct(product);
    navigate("/setup");
  };

  const handleResults = (product: SavedProduct) => {
    loadSavedProduct(product);
    navigate("/results");
  };

  const handleDuplicate = (id: string) => {
    duplicateSavedProduct(id);
    refreshProducts();
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this product? This cannot be undone.")) return;
    const nextProducts = deleteSavedProduct(id);
    if (state.activeSavedProductId === id) setActiveSavedProductId(null);
    setProducts(nextProducts);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/");
  };

  return (
    <div
      className="min-h-screen priceit-fade-in"
      style={{ background: "radial-gradient(ellipse 120% 80% at 50% 0%, #ffffff 28%, #eef8fa 58%, #ffe2d0 100%)" }}
    >
      <header className="sticky top-0 z-20 flex items-center border-b border-[#D0EAF0] bg-white px-4 py-4 shadow-sm">
        <button
          type="button"
          onClick={handleBack}
          className="min-w-[86px] rounded-xl bg-[#0E92A3] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#E1603F]"
        >
          Back
        </button>
        <div className="flex flex-1 justify-center">
          <img src={logo} alt="LaunchPad logo" className="h-12 w-auto" />
        </div>
        <button
          type="button"
          onClick={handleAddAnother}
          className="inline-flex min-w-[86px] items-center justify-end gap-1 rounded-xl bg-[#E1603F] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#C94E32]"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </header>

      <main className="px-4 py-6">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#0E92A3]">My Business</p>
              <h1 className="mt-1 text-3xl font-extrabold leading-tight text-[#2B2B2B]">My Products</h1>
              <p className="mt-1 text-sm font-semibold text-[#4F747C]">{productCountLabel}</p>
            </div>
            <button
              type="button"
              onClick={handleAddAnother}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0E92A3] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#E1603F]"
            >
              <PackagePlus className="h-4 w-4" />
              Add Another Product
            </button>
          </div>

          {products.length === 0 ? (
            <section className="rounded-3xl border-2 border-dashed border-[#CFE8EE] bg-white px-5 py-12 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF7FB] text-[#0E92A3]">
                <PackagePlus className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-xl font-extrabold text-[#2B2B2B]">You have not saved any products yet.</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#4F747C]">
                Create your first product to start building your business.
              </p>
              <button
                type="button"
                onClick={() => navigate(hasMeaningfulProductData(state) ? "/results" : "/create")}
                className="mt-5 rounded-xl bg-[#0E92A3] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#E1603F]"
              >
                Create Product
              </button>
            </section>
          ) : (
            <div className="grid gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOpen={handleOpen}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                  onResults={handleResults}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
