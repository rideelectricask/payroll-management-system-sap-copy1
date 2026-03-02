import { DateUtils } from '../helpers/dateUtils';

export class CalculationUtils {
  static calculateWeeklyEarnings(monthlyFee, cutoffData = null) {
    if (!cutoffData) {
      cutoffData = DateUtils.getWeeklyCutoffCalculation();
    }

    if (cutoffData.singleMonth) {
      const dailyEarnings = monthlyFee / cutoffData.monthlyFee;
      const weeklyEarnings = dailyEarnings * cutoffData.workingDays;

      return {
        monthlyFee,
        daysInMonth: cutoffData.monthlyFee,
        daysInWeek: cutoffData.workingDays,
        dailyEarnings,
        weeklyEarnings
      };
    } else {
      const firstMonthDaily = monthlyFee / cutoffData.firstMonth.monthlyFee;
      const secondMonthDaily = monthlyFee / cutoffData.secondMonth.monthlyFee;

      const firstMonthEarnings = firstMonthDaily * cutoffData.firstMonth.workingDays;
      const secondMonthEarnings = secondMonthDaily * cutoffData.secondMonth.workingDays;

      const totalWeeklyEarnings = firstMonthEarnings + secondMonthEarnings;

      return {
        monthlyFee,
        crossMonth: true,
        firstMonth: {
          daysInMonth: cutoffData.firstMonth.monthlyFee,
          workingDays: cutoffData.firstMonth.workingDays,
          dailyEarnings: firstMonthDaily,
          earnings: firstMonthEarnings
        },
        secondMonth: {
          daysInMonth: cutoffData.secondMonth.monthlyFee,
          workingDays: cutoffData.secondMonth.workingDays,
          dailyEarnings: secondMonthDaily,
          earnings: secondMonthEarnings
        },
        weeklyEarnings: totalWeeklyEarnings
      };
    }
  }

  static calculateRoundUpCharge(roundUp) {
    if (roundUp > 10) {
      const result = roundUp - 10;
      return Math.ceil(result / 1) * 700;
    }
    return 0;
  }

  static calculateRoundDownCharge(roundDownDistance) {
    if (roundDownDistance >= 30) {
      return (roundDownDistance - 30) * 2000;
    }
    return 0;
  }

  static calculateSellingPrice(distance) {
    if (distance <= 3) return 6000;
    if (distance <= 6) return 6500;
    if (distance <= 9) return 7000;
    if (distance <= 12) return 8300;
    if (distance <= 15) return 22300;
    return 29300;
  }

  static calculateSayurboxBayaran(distance) {
    if (distance <= 3) return 5000;
    if (distance <= 6) return 5500;
    if (distance <= 9) return 6000;
    if (distance <= 12) return 7000;
    if (distance <= 15) return 18000;
    return 24000;
  }

  static calculateExtraDistancePay(distance) {
    return distance < 30 ? 0 : (distance - 30) * 2000;
  }

  static calculateWeightCost(roundUp) {
    return roundUp < 10 ? 0 : (roundUp - 10) * 500;
  }

  static calculatePackageBonus(totalPacket) {
    return totalPacket >= 100 ? 125000 : 0;
  }

  static getZonaFromCost(cost) {
    switch (cost) {
      case 5000: return "ZONA 1";
      case 5500: return "ZONA 2";
      case 6000: return "ZONA 3";
      case 7000: return "ZONA 4";
      case 18000: return "ZONA 5";
      case 24000: return "ZONA 6";
      default: return "";
    }
  }

  static getDefaultBonusValues(courierCode, bonusData = []) {
    if (bonusData.length > 0) {
      const matchingBonus = bonusData.find(bonus => 
        bonus.driverName && bonus.driverName.toLowerCase() === courierCode.toLowerCase()
      );

      if (matchingBonus) {
        return {
          festiveBonus: Number(matchingBonus.festiveBonus) || 0,
          afterRekon: Number(matchingBonus.afterRekon) || 0,
          addPersonal: Number(matchingBonus.addPersonal) || 0,
          incentives: Number(matchingBonus.incentives) || 0
        };
      }
    }

    return {
      festiveBonus: 0,
      afterRekon: 0,
      addPersonal: 0,
      incentives: 0
    };
  }

  static calculateZoneFee(zones) {
    return (zones["ZONA 1"] * 5000) + 
           (zones["ZONA 2"] * 5500) + 
           (zones["ZONA 3"] * 6000) + 
           (zones["ZONA 4"] * 7000) + 
           (zones["ZONA 5"] * 18000) + 
           (zones["ZONA 6"] * 24000);
  }

  static calculateAddWeight(totalWeight) {
    return totalWeight > 10 ? (totalWeight - 10) * 500 : 0;
  }

  static safeParseInt(value) {
    return parseInt(value) || 0;
  }

  static safeParseFloat(value) {
    return parseFloat(value) || 0;
  }

  static safeParseNumber(value) {
    return Number(value) || 0;
  }
}