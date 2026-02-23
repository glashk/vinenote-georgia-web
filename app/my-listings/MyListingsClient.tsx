"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Container from "@/components/Container";
import { useLanguage } from "@/contexts/LanguageContext";
import { ConfirmModal } from "@/components/ConfirmModal";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import { useMyListings } from "@/features/listings/hooks/useMyListings";
import { ListingsHeader } from "@/features/listings/components/ListingsHeader";
import { ListingsFilters } from "@/features/listings/components/ListingsFilters";
import { ListingCard } from "@/features/listings/components/ListingCard";
import { EmptyState } from "@/features/listings/components/EmptyState";
import { ListSkeleton } from "@/features/listings/components/ListSkeleton";
import type { Listing } from "@/features/listings/types";
import { useCallback, useEffect, useRef, useState } from "react";

type ModalType = null | { type: "remove"; item: Listing } | { type: "delete"; item: Listing };

export default function MyListingsClient() {
  const { t } = useLanguage();
  const router = useRouter();
  const [modal, setModal] = useState<ModalType>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const prevUserRef = useRef<boolean | null>(null);

  const {
    user,
    listings,
    filteredListings,
    loading,
    error,
    setError,
    filters,
    setFilters,
    updateStatus,
    removeListing,
    deleteListing,
    renewListing,
    activeCount,
    statusCounts,
  } = useMyListings(t);

  const handleRequestRemove = useCallback((item: Listing) => {
    setModal({ type: "remove", item });
  }, []);

  const handleRequestDelete = useCallback((item: Listing) => {
    setModal({ type: "delete", item });
  }, []);

  const handleRequestRenew = useCallback((item: Listing) => {
    setModal({ type: "renew", item });
  }, []);

  const handleConfirmRemove = useCallback(async () => {
    if (modal?.type !== "remove") return;
    setModalLoading(true);
    setError(null);
    try {
      await removeListing(modal.item.id);
      setModal(null);
    } catch (e) {
      console.error("Remove error:", e);
      setError(t("common.error") + ": " + t("market.errorLoad"));
    } finally {
      setModalLoading(false);
    }
  }, [modal, removeListing, setError, t]);

  const handleConfirmDelete = useCallback(async () => {
    if (modal?.type !== "delete") return;
    setModalLoading(true);
    setError(null);
    try {
      await deleteListing(modal.item.id);
      setModal(null);
    } catch (e) {
      console.error("Delete error:", e);
      setError(t("common.error") + ": " + t("market.errorLoad"));
    } finally {
      setModalLoading(false);
    }
  }, [modal, deleteListing, setError, t]);

  useEffect(() => {
    const hadUser = prevUserRef.current;
    prevUserRef.current = !!user;
    if (hadUser === true && !user) {
      router.replace("/");
    }
  }, [user, router]);

  const handleRemove = useCallback(
    (id: string) => {
      const item = filteredListings.find((l) => l.id === id);
      if (item) handleRequestRemove(item);
    },
    [filteredListings, handleRequestRemove]
  );

  const handleDelete = useCallback(
    (id: string) => {
      const item = filteredListings.find((l) => l.id === id);
      if (item) handleRequestDelete(item);
    },
    [filteredListings, handleRequestDelete]
  );

  const handleRenew = useCallback(
    (id: string) => {
      const item = filteredListings.find((l) => l.id === id);
      if (item) handleRequestRenew(item);
    },
    [filteredListings, handleRequestRenew]
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f4f0]">
        <div className="text-center px-6">
          <p className="text-slate-600 mb-4">{t("auth.signIn.noAccount")}</p>
          <Link href="/login" className="vn-btn vn-btn-primary">
            {t("nav.signIn")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f4f0] py-14 sm:py-20">
      <Container>
        <div className="relative z-10 max-w-2xl mx-auto">
          <ListingsHeader activeCount={activeCount} />

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {loading && listings.length === 0 ? (
            <div className="mt-8">
              <ListSkeleton />
            </div>
          ) : listings.length === 0 ? (
            <div className="mt-8">
              <EmptyState variant="no-listings" />
            </div>
          ) : (
            <>
              <div className="mt-8">
                <ListingsFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  totalCount={filteredListings.length}
                  statusCounts={statusCounts}
                />
              </div>

              {filteredListings.length === 0 ? (
                <div className="mt-8">
                  <EmptyState
                    variant="filter-empty"
                    onResetFilters={() => setFilters({ status: "all", category: "all", search: "" })}
                  />
                </div>
              ) : (
                <div className="mt-6 space-y-5">
                  {filteredListings.map((item) => (
                    <ListingCard
                      key={item.id}
                      listing={item}
                      onUpdateStatus={updateStatus}
                      onRemove={handleRemove}
                      onDelete={handleDelete}
                      onRenew={renewListing}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </Container>

      {modal?.type === "remove" && (
        <ConfirmModal
          open={true}
          onClose={() => setModal(null)}
          onConfirm={handleConfirmRemove}
          title={t("market.removeConfirm")}
          message={t("market.removeConfirmMessage")}
          confirmLabel={t("market.removeListing")}
          cancelLabel={t("common.cancel")}
          loadingLabel={t("common.processing")}
          variant="warning"
          loading={modalLoading}
        />
      )}

      {modal?.type === "delete" && (
        <DeleteConfirmModal
          open={true}
          onClose={() => setModal(null)}
          onConfirm={handleConfirmDelete}
          title={t("market.deleteConfirmTitle")}
          message={t("market.deleteConfirm")}
          confirmLabel={t("market.deleteListing")}
          cancelLabel={t("common.cancel")}
          typeConfirmLabel={t("market.deleteTypeConfirm")}
          loadingLabel={t("common.processing")}
          loading={modalLoading}
        />
      )}

      {modal?.type === "renew" && (
        <ConfirmModal
          open={true}
          onClose={() => setModal(null)}
          onConfirm={handleConfirmRenew}
          title={t("market.renewConfirm")}
          message={t("market.renewConfirmMessage")}
          confirmLabel={t("market.renewListing")}
          cancelLabel={t("common.cancel")}
          loadingLabel={t("common.processing")}
          variant="neutral"
          loading={modalLoading}
        />
      )}
    </div>
  );
}
