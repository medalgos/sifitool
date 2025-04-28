

// Reverse outcome--------------------------------------------------------------

function determineReverseSequenceOutcome(formData) {
    const {
        rprResult,              // maternal RPR/VDRL result
        treponemalTest,         // treponemal test result
        treatmentHistory,       // treatment history
        infantTiter,            // infant's titer
        maternalTiter,         // maternal titer
        infantExam             // infant examination result
    } = formData;

    // Non-reactive RPR with non-reactive treponemal test
    if (rprResult === 'nonreactive' && treponemalTest === 'nonreactive') {
        return 4;
    }

    // Check titer comparison
    // if maternal or infant titer null return 6 
    if (!maternalTiter || !infantTiter || !infantExam) {
        return 6;
    }
    const isFourfoldGreaterTiter = isFourfoldOrGreater(infantTiter, maternalTiter);

    // Scenarios for both reactive RPR or reactive treponemal test
    if (rprResult === 'reactive' || treponemalTest === 'reactive') {
        // Adequate treatment before pregnancy
        if (treatmentHistory === 'adequate-before') {
            return 3;
        }

        // Adequate treatment during pregnancy
        if (treatmentHistory === 'adequate-during') {
            if (isFourfoldGreaterTiter) {
                return 0;
            }

            if (infantExam === 'normal' && !isFourfoldGreaterTiter) {
                return 2;
            }

            if (infantExam === 'abnormal') {
                return 0;
            }
        }

        // Inadequate treatment
        if (treatmentHistory === 'inadequate') {
            if (infantExam === 'abnormal' || isFourfoldGreaterTiter) {
                return 0;
            }

            if (infantExam === 'normal' && !isFourfoldGreaterTiter) {
                return 1;
            }
        }
    }

    return 6;
}

window.determineReverseSequenceOutcome = determineReverseSequenceOutcome;