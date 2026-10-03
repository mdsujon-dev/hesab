"use client";

import { useMemo, useState } from "react";
import {
  App,
  Col,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Segmented,
  Space,
  Tag,
  Typography,
} from "antd";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { OfflineBanner } from "@/components/shell/sync-status";
import { createCategory, deleteCategory, updateCategory } from "@/offline/repo";
import { formatMoney } from "@/lib/money";
import type { Category, TxType } from "@/lib/types";
import { MiniLoader } from "@/components/ui/loader";

const SUGGESTED_ICONS = [
  "🍽️","🚌","🏠","💡","🛒","💊","📚","👕","📱","🎬","💼","🏪","💻","📈","🎁","💰","💸","✈️","⚽","🐾",
];

type FormValues = { name: string; icon?: string };

export function CategoriesView() {
  const { categories, transactions, user, loading } = useWorkspace();
  const { modal, message } = App.useApp();
  const [form] = Form.useForm<FormValues>();

  const [tab, setTab] = useState<TxType>("expense");
  const [editing, setEditing] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // How much each category has been used, so deleting is an informed choice.
  const usage = useMemo(() => {
    const totals = new Map<string, { count: number; amount: number }>();
    for (const tx of transactions) {
      if (!tx.categoryId) continue;
      const current = totals.get(tx.categoryId) ?? { count: 0, amount: 0 };
      current.count += 1;
      current.amount += tx.amount;
      totals.set(tx.categoryId, current);
    }
    return totals;
  }, [transactions]);

  const visible = useMemo(
    () => categories.filter((category) => category.type === tab),
    [categories, tab],
  );

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setOpen(true);
  }

  async function onFinish(values: FormValues) {
    const name = values.name.trim();
    const icon = values.icon?.trim() || null;

    const duplicate = categories.find(
      (category) =>
        category.type === tab &&
        category.name.toLowerCase() === name.toLowerCase() &&
        category.localId !== editing?.localId,
    );
    if (duplicate) {
      form.setFields([
        { name: "name", errors: ["A category with this name already exists"] },
      ]);
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updateCategory(editing.localId, { name, icon });
        message.success("Category updated");
      } else {
        await createCategory({ name, icon, type: tab });
        message.success("Category added");
      }
      setOpen(false);
      form.resetFields();
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(category: Category) {
    const used = usage.get(category.localId);
    modal.confirm({
      title: `Delete "${category.name}"?`,
      content: used
        ? `${used.count} transaction${used.count === 1 ? "" : "s"} use this category. They are kept, and will show the category name as recorded.`
        : "This category is not used by any transaction.",
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteCategory(category.localId);
        message.success("Category deleted");
      },
    });
  }

  if (loading) return <MiniLoader label="Loading your records" />;

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      <OfflineBanner />

      <Row gutter={[8, 8]} align="middle">
        <Col xs={24} sm={16}>
          <Segmented<TxType>
            block
            value={tab}
            onChange={setTab}
            options={[
              { label: "Expense categories", value: "expense" },
              { label: "Income categories", value: "income" },
            ]}
          />
        </Col>
        <Col xs={24} sm={8}>
          <Button
            tone="primary"
            icon={<PlusOutlined />}
            onClick={openCreate}
            block
          >
            New category
          </Button>
        </Col>
      </Row>

      <Card styles={{ body: { paddingTop: 4 } }}>
        {visible.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={`No ${tab} categories yet`}
          >
            <Button tone="primary" onClick={openCreate}>
              Add one
            </Button>
          </Empty>
        ) : (
          /*
            A Row/Col grid instead of antd's List `grid` prop: List is
            deprecated in favour of the virtualised Listy, which is not what a
            responsive card grid wants. Same breakpoints, no deprecation.
          */
          <Row gutter={[12, 12]}>
            {visible.map((category) => {
              const used = usage.get(category.localId);
              return (
                <Col key={category.localId} xs={24} sm={12} lg={8} xxl={6}>
                  <Card
                    variant="outlined"
                    size="small"
                    style={{ height: "100%" }}
                    compact
                    actions={[
                      <Button
                        key="edit"
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => openEdit(category)}
                      >
                        Edit
                      </Button>,
                      <Button
                        key="delete"
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => confirmDelete(category)}
                      >
                        Delete
                      </Button>,
                    ]}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl leading-none" aria-hidden>
                        {category.icon ?? (tab === "income" ? "💰" : "💸")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">
                          {category.name}
                        </div>
                        <Typography.Text type="secondary" className="text-xs">
                          {used
                            ? `${used.count} entries · ${formatMoney(used.amount, user.currency)}`
                            : "Not used yet"}
                        </Typography.Text>
                      </div>
                      <Tag color={tab === "income" ? "success" : "error"}>
                        {tab === "income" ? "In" : "Out"}
                      </Tag>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Card>

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        title={editing ? "Edit category" : `New ${tab} category`}
        footer={null}
        destroyOnHidden
        width={420}
        style={{ maxWidth: "calc(100vw - 24px)" }}
      >
        {open ? (
        <Form<FormValues>
          key={editing?.localId ?? "new"}
          form={form}
          layout="vertical"
          size="large"
          onFinish={onFinish}
          disabled={saving}
          initialValues={{
            name: editing?.name ?? "",
            icon: editing?.icon ?? "",
          }}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Enter a name" }]}
          >
            <Input placeholder="e.g. Groceries" autoFocus maxLength={60} />
          </Form.Item>

          <Form.Item name="icon" label="Icon">
            <Input placeholder="Pick one below, or type an emoji" maxLength={8} />
          </Form.Item>

          <div className="mb-4 flex flex-wrap gap-1">
            {SUGGESTED_ICONS.map((icon) => (
              <Button
                key={icon}
                size="small"
                onClick={() => form.setFieldValue("icon", icon)}
                style={{ fontSize: 18, width: 40, height: 40 }}
              >
                {icon}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Button block size="large" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={saving}
            >
              {editing ? "Save" : "Add"}
            </Button>
          </div>
        </Form>
        ) : null}
      </Modal>
    </Space>
  );
}
