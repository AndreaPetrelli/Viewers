import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Input, Button } from '@ohif/ui';
import { DicomMetadataStore } from '@ohif/core';
import { useTranslation } from 'react-i18next';

const DEFAULT_MEATADATA = {
  PatientWeight: null,
  PatientSex: null,
  SeriesTime: null,
  RadiopharmaceuticalInformationSequence: {
    RadionuclideTotalDose: null,
    RadionuclideHalfLife: null,
    RadiopharmaceuticalStartTime: null,
  },
};

/*
 * PETSUV panel enables the user to modify the patient related information, such as
 * patient sex, patientWeight. This is allowed since
 * sometimes these metadata are missing or wrong. By changing them
 * @param param0
 * @returns
 */
export default function PanelPetSUV({ servicesManager, commandsManager }) {
  const { t } = useTranslation('PanelSUV');
  const {
    DisplaySetService,
    ToolGroupService,
    ToolBarService,
    HangingProtocolService,
  } = servicesManager.services;
  const [metadata, setMetadata] = useState(DEFAULT_MEATADATA);
  const [ptDisplaySet, setPtDisplaySet] = useState(null);

  const handleMetadataChange = useCallback(
    metadata => {
      setMetadata(prevState => {
        const newState = { ...prevState };
        Object.keys(metadata).forEach(key => {
          if (typeof metadata[key] === 'object') {
            newState[key] = {
              ...prevState[key],
              ...metadata[key],
            };
          } else {
            newState[key] = metadata[key];
          }
        });
        return newState;
      });
    },
    [metadata]
  );

  const getMatchingPTDisplaySet = useCallback(viewportMatchDetails => {
    const ptDisplaySet = commandsManager.runCommand('getMatchingPTDisplaySet', {
      viewportMatchDetails,
    });

    if (!ptDisplaySet) {
      return;
    }

    const metadata = commandsManager.runCommand('getPTMetadata', {
      ptDisplaySet,
    });

    return {
      ptDisplaySet,
      metadata,
    };
  }, []);

  useEffect(() => {
    const displaySets = DisplaySetService.getActiveDisplaySets();
    const { viewportMatchDetails } = HangingProtocolService.getMatchDetails();
    if (!displaySets.length) {
      return;
    }

    const displaySetInfo = getMatchingPTDisplaySet(viewportMatchDetails);

    if (!displaySetInfo) {
      return;
    }

    const { ptDisplaySet, metadata } = displaySetInfo;
    setPtDisplaySet(ptDisplaySet);
    setMetadata(metadata);
  }, []);

  // get the patientMetadata from the StudyInstanceUIDs and update the state
  useEffect(() => {
    const { unsubscribe } = HangingProtocolService.subscribe(
      HangingProtocolService.EVENTS.PROTOCOL_CHANGED,
      ({ viewportMatchDetails }) => {
        const displaySetInfo = getMatchingPTDisplaySet(viewportMatchDetails);

        if (!displaySetInfo) {
          return;
        }
        const { ptDisplaySet, metadata } = displaySetInfo;
        setPtDisplaySet(ptDisplaySet);
        setMetadata(metadata);
      }
    );
    return () => {
      unsubscribe();
    };
  }, []);

  function updateMetadata() {
    if (!ptDisplaySet) {
      throw new Error('No ptDisplaySet found');
    }

    const toolGroupIds = ToolGroupService.getToolGroupIds();

    // Todo: we don't have a proper way to perform a toggle command and update the
    // state for the toolbar, so here, we manually toggle the toolbar

    // Todo: Crosshairs have bugs for the camera reset currently, so we need to
    // force turn it off before we update the metadata
    toolGroupIds.forEach(toolGroupId => {
      commandsManager.runCommand('toggleCrosshairs', {
        toolGroupId,
        toggledState: false,
      });
    });

    ToolBarService.state.toggles['Crosshairs'] = false;
    ToolBarService._broadcastEvent(
      ToolBarService.EVENTS.TOOL_BAR_STATE_MODIFIED
    );

    // metadata should be dcmjs naturalized
    DicomMetadataStore.updateMetadataForSeries(
      ptDisplaySet.StudyInstanceUID,
      ptDisplaySet.SeriesInstanceUID,
      metadata
    );

    // update the displaySets
    DisplaySetService.setDisplaySetMetadataInvalidated(
      ptDisplaySet.displaySetInstanceUID
    );
  }

  return (
    <div className="overflow-x-hidden overflow-y-auto invisible-scrollbar">
      {
        <div className="flex flex-col">
          <div className="flex flex-col p-4 space-y-2 bg-primary-dark">
            <Input
              label={t('Patient Sex')}
              labelClassName="text-white"
              className="mt-1 mb-2 bg-black border-primary-main"
              type="text"
              containerClassName="mr-2"
              value={metadata.PatientSex || ''}
              onChange={e => {
                handleMetadataChange({
                  PatientSex: e.target.value,
                });
              }}
            />
            <Input
              label={t('Patient Weight (kg)')}
              labelClassName="text-white"
              className="mt-1 mb-2 bg-black border-primary-main"
              type="text"
              containerClassName="mr-2"
              value={metadata.PatientWeight || ''}
              onChange={e => {
                handleMetadataChange({
                  PatientWeight: e.target.value,
                });
              }}
            />
            <Input
              label={t('Total Dose (Mbq)')}
              labelClassName="text-white"
              className="mt-1 mb-2 bg-black border-primary-main"
              type="text"
              containerClassName="mr-2"
              value={
                metadata.RadiopharmaceuticalInformationSequence
                  .RadionuclideTotalDose || ''
              }
              onChange={e => {
                handleMetadataChange({
                  RadiopharmaceuticalInformationSequence: {
                    RadionuclideTotalDose: e.target.value,
                  },
                });
              }}
            />
            <Input
              label={t('Half Life (s)')}
              labelClassName="text-white"
              className="mt-1 mb-2 bg-black border-primary-main"
              type="text"
              containerClassName="mr-2"
              value={
                metadata.RadiopharmaceuticalInformationSequence
                  .RadionuclideHalfLife || ''
              }
              onChange={e => {
                handleMetadataChange({
                  RadiopharmaceuticalInformationSequence: {
                    RadionuclideHalfLife: e.target.value,
                  },
                });
              }}
            />
            <Input
              label={t('Injection Time (s)')}
              labelClassName="text-white"
              className="mt-1 mb-2 bg-black border-primary-main"
              type="text"
              containerClassName="mr-2"
              value={
                metadata.RadiopharmaceuticalInformationSequence
                  .RadiopharmaceuticalStartTime || ''
              }
              onChange={e => {
                handleMetadataChange({
                  RadiopharmaceuticalInformationSequence: {
                    RadiopharmaceuticalStartTime: e.target.value,
                  },
                });
              }}
            />
            <Input
              label={t('Acquisition Time (s)')}
              labelClassName="text-white"
              className="mt-1 mb-2 bg-black border-primary-main"
              type="text"
              containerClassName="mr-2"
              value={metadata.SeriesTime || ''}
              onChange={() => {}}
            />
          </div>
          <Button
            color="primary"
            onClick={updateMetadata}
            className="px-1 py-1 mx-4 mt-2 text-xs text-white border-b border-transparent"
          >
            Reload Data
          </Button>
        </div>
      }
    </div>
  );
}

PanelPetSUV.propTypes = {
  servicesManager: PropTypes.shape({
    services: PropTypes.shape({
      MeasurementService: PropTypes.shape({
        getMeasurements: PropTypes.func.isRequired,
        subscribe: PropTypes.func.isRequired,
        EVENTS: PropTypes.object.isRequired,
        VALUE_TYPES: PropTypes.object.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
};
