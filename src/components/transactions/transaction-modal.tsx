"use client";

import { useMemo, useState } from "react";
import {
  App,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Segmented,
  Select,
  Space,
} from "antd";
import { Button } from "@/components/ui/button";
import dayjs, { type Dayjs } from "dayjs";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { createTransaction, updateTransaction } from "@/offline/repo";
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
  type Transaction,
  type TxType,
} from "@/lib/types";
import { currencySymbol } from "@/lib/money";

type FormValues = {
  type: TxType;
  amount: number;
  categoryId: string | null;
  date: Dayjs;
  paymentMethod: PaymentMethod;
  note?: string;
};

export function TransactionModal({
  open,
  onClose,
  type,
  editing,
  allowTypeSwitch = false,
}: {
  open: boolean;
  onClose: () => void;
  type: TxType;
  /** When present the modal edits this record instead of creating one. */
  editing?: Transaction | null;
  allowTypeSwitch?: boolean;
}) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        editing
          ? "Edit transaction"
          : type === "income"
            ? "Add income"
            : "Add expense"
      }
      footer={null}
      destroyOnHidden
      width={480}
      style={{ top: 24, maxWidth: "calc(100vw - 24px)" }}
    >
      {/*
        The form is mounted fresh for each record, so its initial values come
        from props at mount time — no effect syncing state to props.
      */}
      {open ? (
        <TransactionForm
          key={editing?.localId ?? `new-${type}`}
          type={type}
          editing={editing ?? null}
          allowTypeSwitch={allowTypeSwitch}
          onDone={onClose}
        />
      ) : null}
    </Modal>
  );
}

function TransactionForm({
  type,
  editing,
  allowTypeSwitch,
  onDone,
}: {
  type: TxType;
  editing: Transaction | null;
  allowTypeSwitch: boolean;
  onDone: () => void;
}) {
  const { categories, user } = useWorkspace();
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [activeType, setActiveType] = useState<TxType>(editing?.type ?? type);
  const [saving, setSaving] = useState(false);

  const initialValues = useMemo<Partial<FormValues>>(
    () => ({
      type: editing?.type ?? type,
      amount: editing?.amount,
      categoryId: editing?.categoryId ?? null,
      date: editing ? dayjs(editing.date) : dayjs(),
      paymentMethod: editing?.paymentMethod ?? "cash",
      note: editing?.note ?? "",
    }),
    [editing, type],
  );

  const options = useMemo(
    () =>
      categories
        .filter((category) => category.type === activeType)
        .map((category) => ({
          value: category.localId,
          label: `${category.icon ? `${category.icon} ` : ""}${category.name}`,
        })),
    [categories, activeType],
  );

  async function onFinish(values: FormValues) {
    setSaving(true);
    try {
      const category = categories.find(
        (item) => item.localId === values.categoryId,
      );

      // `type` is only a registered form field when the switcher is shown, so
      // fall back to the type this modal was opened with.
      const resolvedType = values.type ?? activeType;

      const payload = {
        type: resolvedType,
        amount: Number(values.amount),
        categoryId: values.categoryId ?? null,
        categoryName: category?.name ?? null,
        // Keep the time-of-day so same-day entries keep their order.
        date: values.date.toISOString(),
        note: values.note?.trim() ?? "",
        paymentMethod: values.paymentMethod,
      };

      if (editing) {
        await updateTransaction(editing.localId, payload);
        message.success("Transaction updated");
      } else {
        await createTransaction(payload);
        message.success(
          resolvedType === "income" ? "Income added" : "Expense added",
        );
      }

      onDone();
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Could not save the entry",
      );
    } finally {
      setSaving(false);
    }
  }

  const symbol = currencySymbol(user.currency);

  return (
    <Form<FormValues>
      form={form}
      layout="vertical"
      size="large"
      onFinish={onFinish}
      disabled={saving}
      initialValues={initialValues}
    >
      {allowTypeSwitch || editing ? (
        <Form.Item name="type" label="Type">
          <Segmented<TxType>
            block
            size="large"
            options={[
              { label: "Expense", value: "expense" },
              { label: "Income", value: "income" },
            ]}
            onChange={(value) => {
              setActiveType(value);
              // The previous category belongs to the other type.
              form.setFieldValue("categoryId", null);
            }}
          />
        </Form.Item>
      ) : (
        // Still registered, just not shown — an unregistered field is absent
        // from the submitted values, which is how typeless rows were created.
        <Form.Item name="type" hidden>
          <Input type="hidden" />
        </Form.Item>
      )}

      <Form.Item
        name="amount"
        label="Amount"
        rules={[
          { required: true, message: "Enter an amount" },
          {
            type: "number",
            min: 0.01,
            message: "Amount must be greater than 0",
          },
        ]}
      >
        <InputNumber
          prefix={symbol}
          placeholder="0"
          style={{ width: "100%" }}
          min={0}
          step={1}
          // Numeric keypad on mobile without blocking decimals.
          inputMode="decimal"
          autoFocus
        />
      </Form.Item>

      <Form.Item
        name="categoryId"
        label="Category"
        rules={[{ required: true, message: "Choose a category" }]}
      >
        <Select
          options={options}
          placeholder="Choose a category"
          showSearch
          optionFilterProp="label"
          notFoundContent="No categories yet — add one from the Categories page"
        />
      </Form.Item>

      <Space.Compact block className="gap-3 max-sm:flex-col">
        <Form.Item
          name="date"
          label="Date"
          className="flex-1"
          rules={[{ required: true, message: "Pick a date" }]}
        >
          <DatePicker
            style={{ width: "100%" }}
            format="DD MMM YYYY"
            allowClear={false}
            inputReadOnly
            maxDate={dayjs().add(1, "year")}
          />
        </Form.Item>

        <Form.Item
          name="paymentMethod"
          label="Payment method"
          className="flex-1"
        >
          <Select
            options={PAYMENT_METHODS.map((method) => ({
              value: method,
              label: PAYMENT_METHOD_LABELS[method],
            }))}
          />
        </Form.Item>
      </Space.Compact>

      <Form.Item name="note" label="Note">
        <Input.TextArea
          rows={2}
          maxLength={500}
          showCount
          placeholder="What was this for?"
        />
      </Form.Item>

      <div className="flex gap-2">
        <Button block size="large" onClick={onDone} disabled={saving}>
          Cancel
        </Button>
        <Button
          tone="primary"
          htmlType="submit"
          block
          size="large"
          loading={saving}
        >
          {editing ? "Save changes" : "Add"}
        </Button>
      </div>
    </Form>
  );
}
