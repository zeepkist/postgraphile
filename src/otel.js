import { NodeSDK } from "@opentelemetry/sdk-node"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc"
import { resourceFromAttributes } from "@opentelemetry/resources"
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions"
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node"
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'


// Configure OTLP Exporter
const traceExporter = new OTLPTraceExporter({
	url: process.env.OPENTELEMETRY_COLLECTOR_URL ?? '', // Signoz OpenTelemetry Collector
})

const metricExporter = new OTLPMetricExporter({
	url: process.env.OPENTELEMETRY_COLLECTOR_URL ?? '',
})

const sdk = new NodeSDK({
	resource: resourceFromAttributes({
		[ATTR_SERVICE_NAME]: process.env.OPENTELEMETRY_SERVICE_NAME || "graphql-dev",
	}),
	traceExporter,
	metricReader: new PeriodicExportingMetricReader({
		exporter: metricExporter,
		exportIntervalMillis: 10000, // Export metrics every 10 seconds
	}),
	instrumentations: [getNodeAutoInstrumentations()],
})

try {
	sdk.start()
} catch (error) {
	console.error("Error starting the SDK", error)
}

process.on("SIGTERM", () => sdk.shutdown())
process.on("SIGINT", () => sdk.shutdown())
