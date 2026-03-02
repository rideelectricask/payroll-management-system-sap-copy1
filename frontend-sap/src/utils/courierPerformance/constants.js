export const COURIER_TABLE_HEAD = [
"HUB",
"Courier Code", 
"Courier Name",
"Total Deliveries",
"On-Time Deliveries",
"Late Deliveries", 
"On-Time %",
"Late %",
"Delivery Ratio",
"Total Distance",
"Total Fee",
"Total Revenue",
"Total Gross Profit",
"Top Performer",
"Avg All Metrics"
];

export const PERFORMANCE_COLORS = {
EXCELLENT: 'text-green-700 bg-green-100',
GOOD: 'text-blue-700 bg-blue-100', 
AVERAGE: 'text-orange-700 bg-orange-100',
NEEDS_IMPROVEMENT: 'text-red-700 bg-red-100'
};

export const INFO_TEXTS = {
PERFORMANCE_METRICS: "Performance Analysis: On-time delivery rates and efficiency metrics",
DELIVERY_STATS: "Delivery Statistics: Total deliveries, on-time vs late deliveries", 
RATING_SYSTEM: "Rating System: Excellent (99%+), Good (95-99%), Average (90-95%), Needs Improvement (<90%)"
};

export const PERFORMANCE_THRESHOLDS = {
EXCELLENT: 99,
GOOD: 95,
AVERAGE: 90
};

export const DELIVERY_STATUS = {
LATE: 'LATE',
ON_TIME: 'ON_TIME'
};

export const TIME_CONSTANTS = {
HOURS_TO_SECONDS: 3600,
MINUTES_TO_SECONDS: 60,
MS_TO_HOURS: 1000 * 3600
};