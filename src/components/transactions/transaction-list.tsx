"use client";

import { useState } from "react";
import {
  App,
  Button,
  Dropdown,
  Empty,
  Grid,
  Pagination,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  CloudSyncOutlined,
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import DataTable from "@/components/Table/DataTable";
import { MiniLoader } from "@/components/ui/loader";
import { deleteTransaction } from "@/offline/repo";
import { TransactionModal } from "@/components/transactions/transaction-modal";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS, type Transaction } from "@/lib/types";
import { EXPENSE, INCOME } from "@/components/providers/theme-provider";

export type ServerPagination = {
  current: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
};

type Props = {
  transactions: Transaction[];
  currency: string;
  loading?: boolean;
  /** Local ids still waiting to reach the server. */
  pendingIds?: Set<string>;
  emptyText?: string;
  pageSize?: number;
  /**
   * When present, `transactions` is already one page from the server and the
   * footer drives the query. Column sorters are hidden in this mode — they
   * would only reorder the visible page, which is misleading.
   */
  serverPagination?: ServerPagination;
};

export function TransactionList({
  transactions,
  currency,
  loading = false,
  pendingIds,
  emptyText = "No transactions yet",
  pageSize = 20,
  serverPagination,
}: Props) {
  const screens = Grid.useBreakpoint();
  const { modal, message } = App.useApp();
  const [editing, setEditing] = useState<Transaction | null>(null);

  const isServerPaged = Boolean(serverPagination);

  const confirmDelete = (row: Transaction) => {
    modal.confirm({
      title: "Delete this transaction?",
      content: `${row.type === "income" ? "Income" : "Expense"} of ${formatMoney(
        row.amount,
        currency,
      )}${row.categoryName ? ` for ${row.categoryName}` : ""}.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteTransaction(row.localId);
        message.success("Transaction deleted");
      },
    });
  };

  const rowActions = (row: Transaction) => ({
    items: [
      {
        key: "edit",
        icon: <EditOutlined />,
        label: "Edit",
        onClick: () => setEditing(row),
      },
      {
        key: "delete",
        icon: <DeleteOutlined />,
        label: "Delete",
        danger: true,
        onClick: () => confirmDelete(row),
      },
    ],
  });

  const amountCell = (row: Transaction) => (
    <span
      style={{
        color: row.type === "income" ? INCOME : EXPENSE,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {row.type === "income" ? "+" : "-"}
      {formatMoney(row.amount, currency)}
    </span>
  );

  const pendingMark = (row: Transaction) =>
    pendingIds?.has(row.localId) ? (
      <Tooltip title="Saved on this device, waiting to sync">
        <CloudSyncOutlined style={{ color: "#c07d10" }} />
      </Tooltip>
    ) : null;

  const columns: ColumnsType<Transaction> = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 130,
      render: (value: string) => formatDate(value),
      sorter: isServerPaged
        ? undefined
        : (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      defaultSortOrder: isServerPaged ? undefined : "descend",
    },
    {
      title: "Category",
      dataIndex: "categoryName",
      key: "categoryName",
      render: (value: string | null, row) => (
        <span className="flex items-center gap-2">
          {value ?? "Uncategorized"}
          {pendingMark(row)}
        </span>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 104,
      render: (value: Transaction["type"]) => (
        <Tag
          color={value === "income" ? "success" : "error"}
          variant="filled"
          style={{ fontWeight: 500 }}
        >
          {value === "income" ? "Income" : "Expense"}
        </Tag>
      ),
    },
    {
      title: "Method",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      width: 130,
      responsive: ["lg"],
      render: (value: Transaction["paymentMethod"]) =>
        PAYMENT_METHOD_LABELS[value],
    },
    {
      title: "Note",
      dataIndex: "note",
      key: "note",
      responsive: ["xl"],
      render: (value: string) =>
        value ? (
          <Typography.Text type="secondary" ellipsis style={{ maxWidth: 240 }}>
            {value}
          </Typography.Text>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      width: 140,
      sorter: isServerPaged ? undefined : (a, b) => a.amount - b.amount,
      render: (_value, row) => amountCell(row),
    },
    {
      title: "",
      key: "actions",
      width: 52,
      align: "right",
      className: "no-print",
      render: (_value, row) => (
        <Dropdown menu={rowActions(row)} trigger={["click"]}>
          <Button
            type="text"
            size="small"
            aria-label="Transaction actions"
            icon={<MoreOutlined />}
          />
        </Dropdown>
      ),
    },
  ];

  const empty = (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />
  );

  // Desktop pagination lives inside DataTable; this footer is the mobile list's.
  const footer =
    !screens.md &&
    serverPagination &&
    serverPagination.total > serverPagination.pageSize ? (
      <div className="no-print flex justify-end pt-3">
        <Pagination
          size="small"
          current={serverPagination.current}
          pageSize={serverPagination.pageSize}
          total={serverPagination.total}
          onChange={serverPagination.onChange}
          showSizeChanger={screens.md}
          pageSizeOptions={[10, 20, 50, 100]}
          showTotal={
            screens.md
              ? (total, range) => `${range[0]}–${range[1]} of ${total}`
              : undefined
          }
          responsive
        />
      </div>
    ) : null;

  return (
    <>
      {screens.md ? (
        // The project's shared DataTable: zebra rows, pinned-column handling
        // and drag-to-scroll, driven here by the server-side page.
        <DataTable<Transaction>
          rowKey="localId"
          columns={columns}
          data={transactions}
          loading={loading}
          locale={{ emptyText: empty }}
          isPaginate={isServerPaged}
          currentPage={serverPagination?.current}
          limit={serverPagination?.pageSize ?? pageSize}
          total={serverPagination?.total}
          isShowSizeChanger
          setCurrentPage={(next) =>
            serverPagination?.onChange(next, serverPagination.pageSize)
          }
          setLimit={(nextSize) => serverPagination?.onChange(1, nextSize)}
        />
      ) : (
        /*
          A plain stack rather than antd's List: that component is deprecated
          in favour of the virtualised Listy, and virtualisation buys nothing
          for one page of rows. This keeps the same card layout with no
          deprecated dependency.
        */
        <div>
          {loading && transactions.length === 0 ? (
            <MiniLoader />
          ) : transactions.length === 0 ? (
            <div className="py-6">{empty}</div>
          ) : (
            <ul className="m-0 list-none p-0">
              {transactions.map((row) => (
                <li
                  key={row.localId}
                  className="flex items-center gap-3 py-3"
                  style={{ borderBottom: "1px solid #f0f1f5" }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 font-medium">
                      <span className="truncate">
                        {row.categoryName ?? "Uncategorized"}
                      </span>
                      {pendingMark(row)}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs opacity-60">
                      <span>{formatDate(row.date)}</span>
                      <span aria-hidden>·</span>
                      <span>{PAYMENT_METHOD_LABELS[row.paymentMethod]}</span>
                      {row.note ? (
                        <>
                          <span aria-hidden>·</span>
                          <span className="truncate">{row.note}</span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  {amountCell(row)}

                  <Dropdown menu={rowActions(row)} trigger={["click"]}>
                    <Button
                      type="text"
                      aria-label="Transaction actions"
                      icon={<MoreOutlined />}
                    />
                  </Dropdown>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {footer}

      <TransactionModal
        open={editing !== null}
        type={editing?.type ?? "expense"}
        editing={editing}
        onClose={() => setEditing(null)}
      />
    </>
  );
}
