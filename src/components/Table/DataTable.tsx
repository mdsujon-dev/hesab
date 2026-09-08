"use client";

import { Table } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import type { TableProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState, useRef, useEffect } from "react";
import "./DataTable.css";

/**
 * Generic table wrapper: server-driven pagination, optional row selection and
 * drag-to-scroll.
 *
 * Typed on the row shape rather than `any`, so callers keep column and record
 * type-safety, and using antd's own spinner instead of an outside icon library
 * (this project does not depend on one).
 */
export type DataTableProps<RecordType extends object> = {
  data?: RecordType[];
  columns: ColumnsType<RecordType>;
  rowKey?: TableProps<RecordType>["rowKey"];
  currentPage?: number;
  setCurrentPage?: (page: number) => void;
  setLimit?: (size: number) => void;
  limit?: number;
  total?: number;
  isPaginate?: boolean;
  showHeader?: boolean;
  loading?: boolean;
  isFetching?: boolean;
  selectRow?: boolean;
  isShowSizeChanger?: boolean;
  onSelectRowsChange?: (rows: RecordType[]) => void;
  selectedRowKeys?: React.Key[];
  setSelectedRowKeys?: (keys: React.Key[]) => void;
  onTableChange?: TableProps<RecordType>["onChange"];
  expandable?: TableProps<RecordType>["expandable"];
  onRow?: TableProps<RecordType>["onRow"];
  size?: TableProps<RecordType>["size"];
  locale?: TableProps<RecordType>["locale"];
  className?: string;
};

export default function DataTable<RecordType extends object>({
  data,
  columns,
  rowKey,
  currentPage,
  setLimit,
  setCurrentPage,
  selectRow = false,
  isPaginate,
  showHeader,
  total,
  limit,
  loading = false,
  isFetching = false,
  onSelectRowsChange,
  isShowSizeChanger = false,
  selectedRowKeys: controlledSelectedKeys,
  setSelectedRowKeys: setControlledSelectedKeys,
  onTableChange,
  expandable,
  onRow,
  size = "middle",
  locale,
  className,
}: DataTableProps<RecordType>) {
  const showLoader = loading || isFetching;
  const [internalSelectedKeys, setInternalSelectedKeys] = useState<React.Key[]>(
    [],
  );
  const tableRef = useRef<HTMLDivElement>(null);

  const isControlled =
    controlledSelectedKeys !== undefined &&
    typeof setControlledSelectedKeys === "function";
  const selectedRowKeys = isControlled
    ? controlledSelectedKeys
    : internalSelectedKeys;

  // Handle drag to scroll
  useEffect(() => {
    const tableEl = tableRef.current;
    if (!tableEl) return;

    // Ant Design's scroll container
    const scrollContainer =
      tableEl.querySelector(".ant-table-content") ||
      tableEl.querySelector(".ant-table-body");

    if (!scrollContainer) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    /**
     * A drag only counts once the pointer has actually moved.
     *
     * `is-dragging` switches the table to `pointer-events: none`, and it used to
     * go on at mousedown — so pressing the mouse anywhere in the table killed
     * the element under the cursor before the click could land on it. Every
     * row's ⋮ menu, and any button inside a cell, silently did nothing.
     *
     * Five pixels of movement is the difference between "clicking" and
     * "dragging", so that is where the class goes on now.
     */
    const DRAG_THRESHOLD = 5;
    let dragging = false;

    const onMouseDown = (event: MouseEvent) => {
      // Left button only — a right-click is a context menu, not a drag.
      if (event.button !== 0) return;
      isDown = true;
      dragging = false;
      startX = event.pageX - (scrollContainer as HTMLElement).offsetLeft;
      scrollLeft = scrollContainer.scrollLeft;
    };

    const stop = () => {
      isDown = false;
      dragging = false;
      scrollContainer.classList.remove("is-dragging");
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isDown) return;
      const x = event.pageX - (scrollContainer as HTMLElement).offsetLeft;
      const walk = (x - startX) * 1.5; // Drag speed multiplier

      if (!dragging) {
        if (Math.abs(walk) < DRAG_THRESHOLD) return;
        dragging = true;
        scrollContainer.classList.add("is-dragging");
      }

      event.preventDefault();
      scrollContainer.scrollLeft = scrollLeft - walk;
    };

    scrollContainer.addEventListener("mousedown", onMouseDown as EventListener);
    scrollContainer.addEventListener("mouseleave", stop);
    scrollContainer.addEventListener("mouseup", stop);
    scrollContainer.addEventListener("mousemove", onMouseMove as EventListener);

    return () => {
      scrollContainer.removeEventListener(
        "mousedown",
        onMouseDown as EventListener,
      );
      scrollContainer.removeEventListener("mouseleave", stop);
      scrollContainer.removeEventListener("mouseup", stop);
      scrollContainer.removeEventListener(
        "mousemove",
        onMouseMove as EventListener,
      );
    };
  }, [loading, isFetching, data]); // Re-bind if DOM updates

  const handleRowSelectionChange = (
    nextKeys: React.Key[],
    selectedRows: RecordType[],
  ) => {
    if (isControlled) {
      setControlledSelectedKeys(nextKeys);
    } else {
      setInternalSelectedKeys(nextKeys);
    }
    onSelectRowsChange?.(selectedRows);
  };

  const rowSelection: TableProps<RecordType>["rowSelection"] = {
    selectedRowKeys,
    onChange: handleRowSelectionChange,
  };

  return (
    <div ref={tableRef}>
      <Table<RecordType>
        loading={{
          spinning: showLoader,
          indicator: <LoadingOutlined spin style={{ fontSize: 20 }} />,
        }}
        className={`data-table ${className ?? ""}`}
        rowKey={rowKey ?? "_id"}
        rowSelection={selectRow ? rowSelection : undefined}
        dataSource={data ?? []}
        columns={columns}
        expandable={expandable}
        scroll={{ x: true }}
        pagination={
          isPaginate
            ? {
                pageSize: limit || 20,
                // Nothing to page through on a single page, so the whole footer
                // stays out of the way until there is a second one.
                hideOnSinglePage: true,
                showTotal: (count: number, range: [number, number]) => (
                  <span className="text-xs opacity-60">
                    {range[0]}–{range[1]} of {count}
                  </span>
                ),
                total: total ?? data?.length ?? 0,
                current: currentPage,
                onChange: (page) => setCurrentPage?.(page),
                showSizeChanger: isShowSizeChanger,
                pageSizeOptions: ["10", "25", "50", "100"],
                onShowSizeChange: (_current, newSize) => {
                  setLimit?.(newSize);
                  setCurrentPage?.(1);
                },
                showQuickJumper: true,
              }
            : false
        }
        showHeader={showHeader}
        size={size}
        locale={locale}
        onChange={onTableChange}
        onRow={onRow}
      />
    </div>
  );
}
