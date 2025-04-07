import * as PaymentsActions from 'redux/modules/payments-module';
import arrayFirstOrSelf from 'lib/array-first-or-self';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'redux/store';

const useRouterTransaction = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const transaction = useAppSelector((state) => state.payments.transaction);

  useEffect(() => {
    const getTransaction = async () => {
      const transactionId = arrayFirstOrSelf(router.query.id);
      if (!transactionId) {
        return;
      }

      try {
        await dispatch(PaymentsActions.getTransaction(transactionId)).unwrap();
        setIsLoading(false);
      } catch (error) {}
    };

    getTransaction();
  }, [dispatch, router.query.id]);

  return { isLoading, transaction };
};

export default useRouterTransaction;
