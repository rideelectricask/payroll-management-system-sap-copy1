import { DateUtils } from '../utils/helpers/dateUtils.js';
import { CalculationUtils } from '../utils/calculations/CalculationUtils.js';
import DataService from '../services/DataService.js';

export class DataProcessor {
    constructor() {
        this.batchSize = 10000;
        this.courierCostAggregation = new Map();
    }

    async processBatch(batch, bonusData, index) {
        const grouped = {};

        batch.forEach((row) => {
            const processedRow = this.processRow(row, bonusData, index);
            if (processedRow) {
                Object.assign(grouped, processedRow);
            }
        });

        return grouped;
    }

    generateKey(courier, date, orderCode, client, index) {
        index.current++;
        const safeCourier = courier || 'Unknown';
        const safeDate = date || 'NoDate';
        const safeOrderCode = orderCode || `Order-${index.current}`;
        const safeClient = client || 'Unknown';
        return `${safeCourier}_${safeDate}_${safeOrderCode}_${safeClient}_${index.current}`;
    }

    processRow(row, bonusData, index) {
        const {
            "Courier Name": courierName,
            "Courier Code": courierCode,
            "DropOff Done": dropDate,
            "Add Charge 1": charge,
            "Project Name": project,
            "Client Name": client,
            "Order Code": orderCode,
            "Distance": distanceRaw,
            "RoundUp": roundUpRaw,
            "RoundDown Distance": roundDownDistanceRaw,
            "RoundUp Distance": roundUpDistanceRaw,
            "HUB": hub,
            "Weight": weightRaw,
            "Delivery Status": deliveryStatus
        } = row;

        const courier = courierName || courierCode || `Unknown-${courierCode || 'NoCode'}`;
        const safeClient = client || 'Unknown';
        const safeOrderCode = orderCode || `Order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const date = dropDate ? DateUtils.extractDateFromString(dropDate) : new Date().toISOString().split('T')[0];

        const addCharge = CalculationUtils.safeParseInt(charge) || 0;
        const distance = CalculationUtils.safeParseNumber(distanceRaw) || 0;
        const roundUp = CalculationUtils.safeParseInt(roundUpRaw) || 0;
        const roundDownDistance = CalculationUtils.safeParseInt(roundDownDistanceRaw) || 
            CalculationUtils.safeParseInt(roundUpDistanceRaw) || 0;
        const weight = CalculationUtils.safeParseFloat(weightRaw) || 0;

        const bonusValues = CalculationUtils.getDefaultBonusValues(courierCode, bonusData);
        const roundUpCharge = CalculationUtils.calculateRoundUpCharge(roundUp);
        const roundDownCharge = CalculationUtils.calculateRoundDownCharge(roundDownDistance);

        const isBlibliOrZalora = safeClient === "Blibli & Zalora (Sameday)" || safeClient === "Blibli" || safeClient === "Zalora";
        const isSayurbox = safeClient === "Sayurbox";

        const key = this.generateKey(courier, date, safeOrderCode, safeClient, index);
        const groupedData = this.createGroupedData(
            row, safeClient, safeOrderCode, courier, courierCode, date, hub, 
            bonusValues, deliveryStatus, isSayurbox
        );

        return this.calculateRowData(
            key, groupedData, distance, roundUp, roundDownDistance, weight,
            roundUpCharge, roundDownCharge, isBlibliOrZalora, isSayurbox
        );
    }

    calculateDistanceCostForClient(roundUpDistance) {
        const distance = CalculationUtils.safeParseNumber(roundUpDistance) || 0;

        if (distance <= 3) return 6000;
        if (distance <= 6) return 6500;
        if (distance <= 9) return 7000;
        if (distance <= 12) return 8300;
        if (distance <= 15) return 22300;
        return 29300;
    }

    calculateDistanceCostAbove30KmForClient(roundUpDistance) {
        const distance = CalculationUtils.safeParseNumber(roundUpDistance) || 0;
        return distance < 30 ? 0 : (distance - 30) * 2000;
    }

    calculateWeightCostForClient(roundUp) {
        const weight = CalculationUtils.safeParseInt(roundUp) || 0;
        return weight < 10 ? 0 : (weight - 10) * 700;
    }

    createGroupedData(row, client, orderCode, courier, courierCode, date, hub, bonusValues, deliveryStatus, isSayurbox) {
        const distanceCostForClient = this.calculateDistanceCostForClient(row["RoundUp Distance"]);
        const distanceCostAbove30KmForClient = this.calculateDistanceCostAbove30KmForClient(row["RoundUp Distance"]);
        const weightCostForClient = this.calculateWeightCostForClient(row["RoundUp"]);
        const totalCostForClient = distanceCostForClient + distanceCostAbove30KmForClient + weightCostForClient;

        const baseData = {
            "_id": row._id || "",
            "Client Name": client,
            "Project Name": row["Project Name"] || "",
            "Date": row.Date || date,
            "Drop Point": row["Drop Point"] || "",
            "Add Charge 1": row["Add Charge 1"] || 0,
            "Additional Distance Fee": row["Additional Distance Fee"] || 0,
            "Additional Notes For Address": row["Additional Notes For Address"] || 0,
            "Additional RoundUp Fee": row["Additional RoundUp Fee"] || 0,
            "Batch": row.Batch || "",
            "Cnee Address 1": row["Cnee Address 1"] || "",
            "Cnee Address 2": row["Cnee Address 2"] || "",
            "Cnee Area": row["Cnee Area"] || "",
            "Cnee Name": row["Cnee Name"] || "",
            "Cnee Phone": row["Cnee Phone"] || "",
            "Courier Code": courierCode || "",
            "Courier Name": courier,
            "Unit": row["Unit"] || "",
            "Delivery Start": row["Delivery Start"] || "",
            "Delivery Start Date": row["Delivery Start Date"] || "",
            "Delivery Start Time": row["Delivery Start Time"] || "",
            "Delivery Status": deliveryStatus || "PENDING",
            "Distance": row.Distance || 0,
            "DropOff Done": date,
            "ETA": row.ETA || "",
            "HUB": hub || "",
            "Location Expected": row["Location Expected"] || "",
            "Order Code": orderCode || "",
            "Payment Term": row["Payment Term"] || "",
            "Pickup Done": row["Pickup Done"] || "",
            "Receiver": row.Receiver || "",
            "Receiving Date": row["Receiving Date"] || "",
            "Receiving Time": row["Receiving Time"] || "",
            "RoundDown": row.RoundDown || 0,
            "RoundDown Distance": row["RoundDown Distance"] || 0,
            "RoundUp": row.RoundUp || 0,
            "RoundUp Distance": row["RoundUp Distance"] || 0,
            "Slot Time": row["Slot Time"] || "",
            "Weight": row.Weight || "",
            "WeightDecimal": row.WeightDecimal || 0,
            "createdAt": row.createdAt || "",
            "lat_long": row.lat_long || "",
            "updatedAt": row.updatedAt || "",
            "__v": row.__v || 0,
            "Total Pengiriman": 0,
            "Total Bayaran": 0,
            "Cost": 0,
            "Add Cost 1": 0,
            "Add Cost 2": 0,
            "Add Charge 1": 0,
            "Add Charge 2": 0,
            "Selling Price": 0,
            "Profit": 0,
            "Festive Bonus": bonusValues.festiveBonus,
            "After Rekon": bonusValues.afterRekon,
            "Add Personal": bonusValues.addPersonal,
            "Incentives": bonusValues.incentives,
            "distanceCostForClient": distanceCostForClient,
            "distanceCostAbove30KmForClient": distanceCostAbove30KmForClient,
            "weightCostForClient": weightCostForClient,
            "totalCostForClient": totalCostForClient
        };

        if (isSayurbox) {
            baseData["Zona"] = "";
        }

        return baseData;
    }

    calculateRowData(key, groupedData, distance, roundUp, roundDownDistance, weight, roundUpCharge, roundDownCharge, isBlibliOrZalora, isSayurbox) {
        const result = {};

        if (!result[key]) {
            result[key] = { ...groupedData };
        }

        result[key]["Total Pengiriman"]++;

        let bayaran = 0;
        let sellingPrice = 0;
        let cost = 0;
        let addCost1 = 0;
        let addCost2 = 0;
        let zona = "";

        if (isBlibliOrZalora) {
            const calculations = this.calculateBlibliZalora(result[key]["Total Pengiriman"], distance);
            bayaran = calculations.bayaran;
            sellingPrice = calculations.sellingPrice;
            cost = calculations.cost;
        } else if (isSayurbox) {
            const calculations = this.calculateSayurbox(distance, roundUp, roundDownDistance, weight);
            bayaran = calculations.bayaran;
            sellingPrice = calculations.sellingPrice;
            cost = calculations.cost;
            addCost1 = calculations.addCost1;
            addCost2 = calculations.addCost2;
            zona = calculations.zona;

            result[key]["Zona"] = zona;
            result[key]["RoundUp Distance"] = calculations.roundedDistance;
            result[key]["RoundDown Distance"] = roundDownDistance;
            result[key]["Weight"] = weight;
        } else {
            sellingPrice = CalculationUtils.calculateSellingPrice(distance);
        }

        if (isNaN(sellingPrice)) {
            sellingPrice = 0;
        }

        this.updateGroupedData(result[key], bayaran, sellingPrice, cost, addCost1, addCost2, roundUpCharge, roundDownCharge);

        const profit = sellingPrice + roundUpCharge + roundDownCharge - cost - addCost1 - addCost2;

        this.aggregateCourierCost(
            result[key]["Courier Name"], 
            result[key]["Courier Code"], 
            cost, 
            addCost1, 
            sellingPrice
        );

        return result;
    }

    aggregateCourierCost(courierName, courierCode, cost, addCost1, sellingPrice) {
        const courierKey = `${courierName}|${courierCode}`;

        const safeCost = isNaN(cost) ? 0 : cost;
        const safeAddCost1 = isNaN(addCost1) ? 0 : addCost1;
        const safeSellingPrice = isNaN(sellingPrice) ? 0 : sellingPrice;

        if (this.courierCostAggregation.has(courierKey)) {
            const existing = this.courierCostAggregation.get(courierKey);
            existing.totalCost += safeCost;
            existing.totalAddCost1 += safeAddCost1;
            existing.totalSum += (safeCost + safeAddCost1);
            existing.totalSellingPrice += safeSellingPrice;
            existing.count++;
        } else {
            this.courierCostAggregation.set(courierKey, {
                courierName,
                courierCode,
                totalCost: safeCost,
                totalAddCost1: safeAddCost1,
                totalSum: safeCost + safeAddCost1,
                totalSellingPrice: safeSellingPrice,
                count: 1
            });
        }
    }

    logCourierCostAggregation() {
        const sortedResults = Array.from(this.courierCostAggregation.values())
            .sort((a, b) => b.totalSum - a.totalSum);
    }

    resetCourierCostAggregation() {
        this.courierCostAggregation.clear();
    }

    calculateBlibliZalora(orderNumber, distance) {
        let bayaran = 0;

        if (orderNumber === 1) {
            bayaran = 16000;
        } else if (orderNumber <= 3) {
            bayaran = 0;
        } else {
            bayaran = 8000;
        }

        const sellingPrice = CalculationUtils.calculateSellingPrice(distance);
        const cost = bayaran;

        return { bayaran, sellingPrice, cost };
    }

    calculateSayurbox(distance, roundUp, roundDownDistance, weight) {
        const safeDistance = Math.max(0, distance);
        const roundedDistance = safeDistance % 1 === 0 ? safeDistance : Math.ceil(safeDistance);
        const distanceCost = CalculationUtils.calculateSayurboxBayaran(roundedDistance);
        const distanceExceeds30 = CalculationUtils.calculateExtraDistancePay(roundedDistance);
        const weightCost = CalculationUtils.calculateWeightCost(roundUp);

        const bayaran = distanceCost + distanceExceeds30 + weightCost;
        const sellingPrice = CalculationUtils.calculateSellingPrice(safeDistance);
        const zona = CalculationUtils.getZonaFromCost(distanceCost);

        return {
            bayaran,
            sellingPrice,
            cost: distanceCost,
            addCost1: weightCost,
            addCost2: distanceExceeds30,
            zona,
            roundedDistance
        };
    }

    updateGroupedData(groupedData, bayaran, sellingPrice, cost, addCost1, addCost2, roundUpCharge, roundDownCharge) {
        const safeBayaran = isNaN(bayaran) ? 0 : bayaran;
        const safeSellingPrice = isNaN(sellingPrice) ? 0 : sellingPrice;
        const safeCost = isNaN(cost) ? 0 : cost;
        const safeAddCost1 = isNaN(addCost1) ? 0 : addCost1;
        const safeAddCost2 = isNaN(addCost2) ? 0 : addCost2;
        const safeRoundUpCharge = isNaN(roundUpCharge) ? 0 : roundUpCharge;
        const safeRoundDownCharge = isNaN(roundDownCharge) ? 0 : roundDownCharge;

        groupedData["Total Bayaran"] += safeBayaran;
        groupedData["Cost"] += safeCost;
        groupedData["Add Cost 1"] += safeAddCost1;
        groupedData["Add Cost 2"] += safeAddCost2;
        groupedData["Add Charge 1"] += safeRoundUpCharge;
        groupedData["Add Charge 2"] += safeRoundDownCharge;
        groupedData["Selling Price"] += safeSellingPrice;

        const currentProfit = safeSellingPrice + safeRoundUpCharge + safeRoundDownCharge - safeCost - safeAddCost1 - safeAddCost2;
        groupedData["Profit"] += currentProfit;
    }

    async groupByCourierAndDate(data, bonusDataCache = null, forceRefreshBonus = false) {
        if (!data || !Array.isArray(data) || data.length === 0) {
            return [];
        }

        let bonusData = bonusDataCache;
        if (!bonusData || forceRefreshBonus) {
            bonusData = await DataService.getBonusData(forceRefreshBonus);
        }

        this.resetCourierCostAggregation();

        const index = { current: 0 };
        const totalBatches = Math.ceil(data.length / this.batchSize);
        const allResults = {};

        for (let i = 0; i < totalBatches; i++) {
            const start = i * this.batchSize;
            const end = Math.min(start + this.batchSize, data.length);
            const batch = data.slice(start, end);

            const batchResults = await this.processBatch(batch, bonusData, index);
            Object.assign(allResults, batchResults);
        }

        const result = Object.values(allResults);

        this.logCourierCostAggregation();

        return result;
    }
}