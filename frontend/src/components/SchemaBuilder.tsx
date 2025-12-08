import { useEffect, useState } from "react";

type Field = {
  name: string;
  selector: string;
  type: string;
};

interface SchemaBuilderProps {
  onChange: (schema: Record<string, unknown> | null) => void;
  initialSchema?: Record<string, unknown> | null;
}

export function SchemaBuilder({ onChange, initialSchema }: SchemaBuilderProps) {
  const [fields, setFields] = useState<Field[]>([]);

  useEffect(() => {
    if (!initialSchema) return;
    const schemaFields =
      (initialSchema as { fields?: Field[] }).fields?.map((field) => ({
        name: field.name || "",
        selector: field.selector || "",
        type: field.type || "text",
      })) ?? [];

    if (schemaFields.length > 0) {
      setFields(schemaFields);
    }
  }, [initialSchema]);

  useEffect(() => {
    const schema =
      fields.length === 0
        ? initialSchema ?? null
        : {
            name: "Custom Extraction",
            baseSelector: "body",
            fields: fields.map((field) => ({
              name: field.name,
              selector: field.selector,
              type: field.type || "text",
            })),
          };

    onChange(schema);
  }, [fields, initialSchema, onChange]);

  const updateField = (index: number, key: keyof Field, value: string) => {
    setFields((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const addField = () => {
    setFields((prev) => [...prev, { name: "", selector: "", type: "text" }]);
  };

  const removeField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3 rounded border border-slate-800 bg-slate-900/50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Schema Builder</h3>
          <p className="text-xs text-slate-400">
            Define fields to extract structured data using CSS selectors.
          </p>
        </div>
        <button
          type="button"
          onClick={addField}
          className="inline-flex items-center rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-500"
        >
          Add Field
        </button>
      </div>

      {fields.length === 0 && (
        <div className="rounded border border-dashed border-slate-700 bg-slate-950/50 p-3 text-xs text-slate-400">
          No fields yet. Click "Add Field" to start building your schema.
        </div>
      )}

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div
            key={`${field.name}-${index}`}
            className="rounded border border-slate-800 bg-slate-950/40 p-3"
          >
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Field Name</label>
                <input
                  type="text"
                  value={field.name}
                  onChange={(e) => updateField(index, "name", e.target.value)}
                  placeholder="title"
                  className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">CSS Selector</label>
                <input
                  type="text"
                  value={field.selector}
                  onChange={(e) => updateField(index, "selector", e.target.value)}
                  placeholder="article h1"
                  className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Type</label>
                <select
                  value={field.type}
                  onChange={(e) => updateField(index, "type", e.target.value)}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="text">Text</option>
                  <option value="html">HTML</option>
                  <option value="attr">Attribute</option>
                </select>
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => removeField(index)}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SchemaBuilder;
