import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/lib/utils";

const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    icon?: React.ComponentType;
    color?: string;
    theme?: Record<keyof typeof THEMES, string>;
  }
>;

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

type ChartContainerProps = React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
};

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ id, className, children, config, ...props }, ref) => {
    const uniqueId = React.useId();
    const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

    return (
      <ChartContext.Provider value={{ config }}>
        <div
          data-chart={chartId}
          ref={ref}
          className={cn(
            "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-[#5C7F87] [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-[#CDEBF0] [&_.recharts-curve.recharts-tooltip-cursor]:stroke-[#CDEBF0] [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-pie-label-text]:fill-[#2B2B2B] [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-[#CDEBF0] [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-[#EAF8FA] [&_.recharts-reference-line_[stroke='#ccc']]:stroke-[#CDEBF0]",
            className,
          )}
          {...props}
        >
          <ChartStyle id={chartId} config={config} />
          <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
        </div>
      </ChartContext.Provider>
    );
  },
);
ChartContainer.displayName = "ChartContainer";

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colorConfig = Object.entries(config).filter(
    ([, itemConfig]) => typeof itemConfig.color === "string" || itemConfig.theme,
  );

  if (!colorConfig.length) {
    return null;
  }

  const css = Object.entries(THEMES)
    .map(([theme, prefix]) => {
      const declarations = colorConfig
        .map(([key, itemConfig]) => {
          const themed = itemConfig.theme?.[theme as keyof typeof THEMES];
          const color = themed || itemConfig.color;
          return color ? `  --color-${key}: ${color};` : "";
        })
        .filter(Boolean)
        .join("\n");

      return `${prefix} [data-chart=${id}] {\n${declarations}\n}`;
    })
    .join("\n");

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

const ChartTooltip = RechartsPrimitive.Tooltip;

type TooltipValue = number | string;

type TooltipPayload = {
  name?: string;
  value?: TooltipValue;
  dataKey?: string;
  color?: string;
  payload?: Record<string, unknown>;
};

type ChartTooltipContentProps = React.HTMLAttributes<HTMLDivElement> & {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  formatter?: (
    value: TooltipValue | undefined,
    name: string | undefined,
    item: TooltipPayload,
    index: number,
    itemPayload: Record<string, unknown> | undefined,
  ) => React.ReactNode;
  labelFormatter?: (label: React.ReactNode, payload: TooltipPayload[]) => React.ReactNode;
  hideLabel?: boolean;
  hideIndicator?: boolean;
  indicator?: "line" | "dot" | "dashed";
  nameKey?: string;
  labelKey?: string;
};

const ChartTooltipContent = React.forwardRef<HTMLDivElement, ChartTooltipContentProps>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      formatter,
      nameKey,
      labelKey,
    },
    ref,
  ) => {
    const { config } = useChart();

    if (!active || !payload?.length) {
      return null;
    }

    const firstPayloadItem = payload[0];
    const firstKey = `${labelKey || firstPayloadItem?.dataKey || firstPayloadItem?.name || "value"}`;
    const firstConfig = getPayloadConfigFromPayload(config, firstPayloadItem, firstKey);
    const resolvedLabel =
      !labelKey && typeof label === "string" ? (config[label]?.label ?? label) : firstConfig?.label;

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-xl border border-[#CDEBF0] bg-white px-3 py-2 text-xs shadow-xl",
          className,
        )}
      >
        {!hideLabel && (
          <div className="font-bold text-[#2B2B2B]">
            {labelFormatter ? labelFormatter(resolvedLabel, payload) : resolvedLabel}
          </div>
        )}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`;
            const itemConfig = getPayloadConfigFromPayload(config, item, key);
            const payloadFill =
              item.payload && typeof item.payload.fill === "string" ? item.payload.fill : undefined;
            const indicatorColor = payloadFill || item.color || "#0E92A3";

            return (
              <div
                key={`${item.dataKey || item.name || "item"}-${index}`}
                className="flex w-full flex-wrap items-center gap-2"
              >
                {!hideIndicator && !itemConfig?.icon && (
                  <div
                    className={cn(
                      "shrink-0 rounded-[2px]",
                      indicator === "dot" && "h-2.5 w-2.5",
                      indicator === "line" && "h-3 w-1",
                      indicator === "dashed" && "h-0 w-3 border-t border-dashed",
                    )}
                    style={{
                      backgroundColor: indicator === "dashed" ? "transparent" : indicatorColor,
                      borderColor: indicatorColor,
                    }}
                  />
                )}
                {itemConfig?.icon && <itemConfig.icon />}
                <div className="flex flex-1 justify-between leading-none">
                  <span className="text-[#486B73]">{itemConfig?.label || item.name}</span>
                  {formatter ? (
                    formatter(item.value, item.name, item, index, item.payload)
                  ) : (
                    <span className="font-semibold text-[#2B2B2B] tabular-nums">
                      {typeof item.value === "number" ? `$${item.value.toFixed(0)}` : item.value}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);
ChartTooltipContent.displayName = "ChartTooltipContent";

const ChartLegend = RechartsPrimitive.Legend;

type LegendPayload = {
  dataKey?: string;
  value?: string;
  color?: string;
  payload?: Record<string, unknown>;
};

type ChartLegendContentProps = React.HTMLAttributes<HTMLDivElement> & {
  payload?: LegendPayload[];
  verticalAlign?: "top" | "middle" | "bottom";
  hideIcon?: boolean;
  nameKey?: string;
};

const ChartLegendContent = React.forwardRef<HTMLDivElement, ChartLegendContentProps>(
  ({ className, hideIcon = false, payload, verticalAlign = "bottom", nameKey }, ref) => {
    const { config } = useChart();

    if (!payload?.length) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className,
        )}
      >
        {payload.map((item) => {
          const key = `${nameKey || item.dataKey || "value"}`;
          const itemConfig = getPayloadConfigFromPayload(config, item, key);

          return (
            <div key={item.value} className="flex items-center gap-1.5">
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: item.color }} />
              )}
              <span className="text-xs font-semibold text-[#486B73]">{itemConfig?.label}</span>
            </div>
          );
        })}
      </div>
    );
  },
);
ChartLegendContent.displayName = "ChartLegendContent";

function getPayloadConfigFromPayload(config: ChartConfig, payload: unknown, key: string) {
  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }

  const payloadItem = payload as {
    payload?: unknown;
    [key: string]: unknown;
  };

  let configKey = key;

  if (key in payloadItem && typeof payloadItem[key] === "string") {
    configKey = payloadItem[key] as string;
  } else if (
    payloadItem.payload &&
    typeof payloadItem.payload === "object" &&
    payloadItem.payload !== null &&
    key in payloadItem.payload &&
    typeof (payloadItem.payload as Record<string, unknown>)[key] === "string"
  ) {
    configKey = (payloadItem.payload as Record<string, string>)[key];
  }

  return config[configKey] || config[key];
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
};
