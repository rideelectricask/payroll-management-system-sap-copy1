import { useState, useCallback } from 'react';
import _ from 'lodash';

export const useBonusMatching = (memoizedData, bonusData) => {
  const [matchedBonusData, setMatchedBonusData] = useState([]);

  const matchBonusData = useCallback(() => {
    if (!memoizedData.length || !bonusData?.length) return [];

    const bonusMap = _.keyBy(bonusData, 'driverName');
    const matchedResults = [];

    memoizedData.forEach(row => {
      const courierCode = row["Courier Code"];
      if (!courierCode) return;

      const matchedBonus = bonusMap[courierCode];
      if (matchedBonus) {
        matchedResults.push({
          courierCode,
          festiveBonus: matchedBonus.festiveBonus || 0,
          afterRekon: matchedBonus.afterRekon || 0,
          addPersonal: matchedBonus.addPersonal || 0,
          incentives: matchedBonus.incentives || 0,
          hub: matchedBonus.hub || '',
          totalFee: matchedBonus.totalFee || 0
        });
      }
    });

    return matchedResults;
  }, [memoizedData, bonusData]);

  const handleZoneAnalysis = useCallback(() => {
    try {
      const matches = matchBonusData();
      setMatchedBonusData(matches);
      return matches;
    } catch (error) {
      console.error('Error during zone analysis:', error);
      return [];
    }
  }, [matchBonusData]);

  return {
    matchedBonusData,
    handleZoneAnalysis
  };
};